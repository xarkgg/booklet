import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from '../lib/haptics';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, Path } from 'react-native-svg';
import { PRESS } from '../animation/motion';
import { usePressFeedback } from '../animation/usePressFeedback';
import { SHEET_COLLAPSED } from '../hooks/useBookLayout';
import {
  WEEK_LABELS,
  formatMonth,
  fromDayKey,
  monthGrid,
  toDayKey,
  todayKey,
  weekOf,
  type DayKey,
} from '../lib/dates';
import { colors, fonts } from '../theme';

const ROW = 40;
const EXPAND_SPRING = { dampingRatio: 0.9, duration: 420 } as const;

type Props = {
  bottomInset: number;
  /** 0 = off screen, 1 = shown (driven by the book opening). */
  shown: SharedValue<number>;
  /** 1 = visible, 0 = dropped away while a page is expanded. */
  chrome: SharedValue<number>;
  daysWithEntries: Set<DayKey>;
  selectedDay: DayKey | null;
  onSelectDay: (day: DayKey | null) => void;
};

function Chevron({ dir, color }: { dir: 'left' | 'right'; color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path
        d={dir === 'right' ? 'M5 2.5 9.5 7 5 11.5' : 'M9 2.5 4.5 7 9 11.5'}
        stroke={color}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TodayIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx={11} cy={11} r={9} stroke={color} strokeWidth={1.6} fill="none" />
      <Circle cx={11} cy={11} r={4.2} fill={color} />
    </Svg>
  );
}

type DayCellProps = {
  date: Date;
  dimmed: boolean;
  hasEntry: boolean;
  selected: boolean;
  today: boolean;
  onPress: () => void;
};

function DayCell({ date, dimmed, hasEntry, selected, today, onPress }: DayCellProps) {
  const press = usePressFeedback(PRESS.smallScale);
  return (
    <Pressable
      onPress={onPress}
      {...press.handlers}
      style={styles.cell}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${date.toDateString()}${hasEntry ? ', has entries' : ''}`}
    >
      <Animated.View
        style={[styles.dayBubble, selected && styles.daySelected, today && !selected && styles.dayToday, press.style]}
      >
        <Text
          style={[
            styles.dayText,
            hasEntry && styles.dayWithEntry,
            selected && styles.dayTextSelected,
            dimmed && styles.dayDimmed,
          ]}
        >
          {date.getDate()}
        </Text>
      </Animated.View>
      <View style={[styles.dot, { opacity: hasEntry ? 1 : 0 }]} />
    </Pressable>
  );
}

/**
 * Bottom sheet with the month header and week strip. Drag it up (or tap the
 * month) to see the whole month. Tapping a day shows that day's entries;
 * tapping it again shows every entry.
 */
export function CalendarSheet({ bottomInset, shown, chrome, daysWithEntries, selectedDay, onSelectDay }: Props) {
  const focus = selectedDay ? fromDayKey(selectedDay) : new Date();
  const [month, setMonth] = useState(() => ({ y: focus.getFullYear(), m: focus.getMonth() }));
  const expanded = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const today = todayKey();

  const grid = useMemo(() => monthGrid(month.y, month.m), [month]);
  const week = useMemo(() => weekOf(selectedDay ? fromDayKey(selectedDay) : new Date()), [selectedDay]);
  const [monthOpen, setMonthOpen] = useState(false);
  const extra = (grid.length - 1) * ROW + 6;
  const collapsedH = SHEET_COLLAPSED + bottomInset;

  const setExpanded = (v: number) => {
    setMonthOpen(v === 1);
    expanded.value = withSpring(v, EXPAND_SPRING);
  };

  const pan = usePanGesture({
    activeOffsetY: [-8, 8],
    onBegin: () => {
      'worklet';
      dragStart.value = expanded.value;
    },
    onUpdate: (e) => {
      'worklet';
      expanded.value = Math.max(-0.08, Math.min(1.08, dragStart.value - e.translationY / extra));
    },
    onDeactivate: (e) => {
      'worklet';
      const target = e.velocityY < -400 ? 1 : e.velocityY > 400 ? 0 : expanded.value > 0.5 ? 1 : 0;
      expanded.value = withSpring(target, EXPAND_SPRING);
      scheduleOnRN(setMonthOpen, target === 1);
    },
  });

  const sheetStyle = useAnimatedStyle(() => {
    const height = collapsedH + Math.max(0, expanded.value) * extra;
    const hidden = Math.min(shown.value, chrome.value);
    return {
      height,
      transform: [{ translateY: (1 - hidden) * (height + 40) + Math.min(0, expanded.value) * -extra }],
    };
  });
  const weekStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.value, [0, 0.4], [1, 0], Extrapolation.CLAMP),
  }));
  const monthStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.value, [0.3, 0.9], [0, 1], Extrapolation.CLAMP),
  }));
  const navStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const choose = (d: Date) => {
    const key = toDayKey(d);
    Haptics.selection();
    onSelectDay(key === selectedDay ? null : key);
    if (d.getMonth() !== month.m || d.getFullYear() !== month.y) {
      setMonth({ y: d.getFullYear(), m: d.getMonth() });
    }
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(month.y, month.m + delta, 1);
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
  };

  const goToday = () => {
    const now = new Date();
    setMonth({ y: now.getFullYear(), m: now.getMonth() });
    Haptics.selection();
    onSelectDay(selectedDay === today ? null : today);
  };

  const headerMonth = formatMonth(month.y, month.m);

  return (
    <Animated.View style={[styles.sheet, { paddingBottom: bottomInset }, sheetStyle]}>
      <GestureDetector gesture={pan}>
        <View>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Pressable
              style={styles.monthButton}
              onPress={() => setExpanded(expanded.value > 0.5 ? 0 : 1)}
              accessibilityRole="button"
              accessibilityLabel={`${headerMonth}, show month`}
            >
              <Text style={styles.month}>{headerMonth}</Text>
              <Chevron dir="right" color={colors.text} />
            </Pressable>
            <Animated.View style={[styles.nav, navStyle]} pointerEvents={monthOpen ? 'auto' : 'none'}>
              <Pressable hitSlop={10} onPress={() => shiftMonth(-1)} accessibilityLabel="Previous month">
                <Chevron dir="left" color={colors.textMuted} />
              </Pressable>
              <Pressable hitSlop={10} onPress={() => shiftMonth(1)} accessibilityLabel="Next month">
                <Chevron dir="right" color={colors.textMuted} />
              </Pressable>
            </Animated.View>
            <Pressable hitSlop={10} onPress={goToday} accessibilityRole="button" accessibilityLabel="Today">
              <TodayIcon color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.labels}>
            {WEEK_LABELS.map((l) => (
              <Text key={l} style={styles.label}>
                {l}
              </Text>
            ))}
          </View>
        </View>
      </GestureDetector>

      <View>
        <Animated.View style={[styles.row, weekStyle]} pointerEvents={monthOpen ? 'none' : 'auto'}>
          {week.map((d) => {
            const key = toDayKey(d);
            return (
              <DayCell
                key={key}
                date={d}
                dimmed={false}
                hasEntry={daysWithEntries.has(key)}
                selected={key === selectedDay}
                today={key === today}
                onPress={() => choose(d)}
              />
            );
          })}
        </Animated.View>
        <Animated.View style={[styles.grid, monthStyle]} pointerEvents={monthOpen ? 'auto' : 'none'}>
          {grid.map((row) => (
            <View key={toDayKey(row[0])} style={styles.row}>
              {row.map((d) => {
                const key = toDayKey(d);
                return (
                  <DayCell
                    key={key}
                    date={d}
                    dimmed={d.getMonth() !== month.m}
                    hasEntry={daysWithEntries.has(key)}
                    selected={key === selectedDay}
                    today={key === today}
                    onPress={() => choose(d)}
                  />
                );
              })}
            </View>
          ))}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 0,
    backgroundColor: colors.sheet,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.sheetHandle,
    marginTop: 8,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 6,
  },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  month: {
    fontFamily: fonts.body,
    fontSize: 18,
    color: colors.text,
  },
  nav: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 26,
    paddingRight: 22,
  },
  labels: {
    flexDirection: 'row',
    marginTop: 8,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#c9c6ca',
  },
  row: {
    flexDirection: 'row',
    height: ROW,
  },
  grid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubble: {
    width: 32,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: '#5c5960',
  },
  dayToday: {
    borderWidth: 1,
    borderColor: '#5c5960',
  },
  dayText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textFaint,
  },
  dayWithEntry: {
    color: colors.text,
  },
  dayTextSelected: {
    color: '#fff',
  },
  dayDimmed: {
    opacity: 0.4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
    marginTop: -2,
  },
});
