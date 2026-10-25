import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureDetector, ScrollView, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle } from 'react-native-svg';
import { DISMISS, EXPAND } from '../animation/motion';
import type { BookLayout } from '../hooks/useBookLayout';
import { formatLong } from '../lib/dates';
import { colors, fonts } from '../theme';
import { PageFace, type Page } from './PageFace';
import { VoiceNote } from './VoiceNote';

type Props = {
  layout: BookLayout;
  page: Page;
  position: number;
  count: number;
  /** 0 = sitting in the book, 1 = full screen. */
  expand: SharedValue<number>;
  /** Downward drag offset while dismissing. */
  drag: SharedValue<number>;
  onDismiss: () => void;
  onSaveText: (text: string) => void;
  onDelete: () => void;
};

function MoreIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx={11} cy={11} r={9.5} stroke={colors.inkMuted} strokeWidth={1.3} fill="none" />
      {[7, 11, 15].map((x) => (
        <Circle key={x} cx={x} cy={11} r={1.2} fill={colors.inkMuted} />
      ))}
    </Svg>
  );
}

/**
 * A page lifted out of the book. It starts on the spread's exact rectangle,
 * lifts (shrinks slightly and loses the fold), then grows to fill the screen.
 * Drag it down to put it back.
 */
export function EntryCard({ layout, page, position, count, expand, drag, onDismiss, onSaveText, onDelete }: Props) {
  const { W, H, insets, spreadW, spreadH, spreadLeft, spreadTop } = layout;
  const entry = page.entry;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry?.text ?? '');
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    setDraft(entry?.text ?? '');
  }, [entry?.text]);

  const full = {
    left: EXPAND.inset,
    top: insets.top + 4,
    width: W - EXPAND.inset * 2,
    height: H - insets.top - 4 - EXPAND.inset,
  };

  const frame = useAnimatedStyle(() => {
    const e = expand.value;
    const lift = interpolate(e, [0, EXPAND.liftEnd], [1, EXPAND.liftScale], Extrapolation.CLAMP);
    const lw = spreadW * lift;
    const lh = spreadH * (1 - (1 - lift) * 0.4);
    const ll = spreadLeft + (spreadW - lw) / 2;
    const lt = spreadTop + (spreadH - lh) / 2;
    const g = interpolate(e, [EXPAND.liftEnd, 1], [0, 1], Extrapolation.CLAMP);
    return {
      left: ll + (full.left - ll) * g,
      top: lt + (full.top - lt) * g + Math.max(0, drag.value),
      width: lw + (full.width - lw) * g,
      height: lh + (full.height - lh) * g,
      borderRadius: 12 + (EXPAND.radius - 12) * g,
    };
  });

  const foldStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expand.value, [0, 0.45], [1, 0], Extrapolation.CLAMP),
  }));
  const smallText = useAnimatedStyle(() => ({
    opacity: interpolate(expand.value, [0.25, 0.5], [1, 0], Extrapolation.CLAMP),
  }));
  const largeText = useAnimatedStyle(() => ({
    opacity: interpolate(expand.value, [0.45, 0.75], [0, 1], Extrapolation.CLAMP),
  }));

  const pan = usePanGesture({
    enabled: !editing && atTop,
    activeOffsetY: 14,
    failOffsetY: -10,
    failOffsetX: [-24, 24],
    onUpdate: (e) => {
      'worklet';
      drag.value = Math.max(0, e.translationY);
    },
    onDeactivate: (e) => {
      'worklet';
      if (drag.value > DISMISS.distance || e.velocityY > DISMISS.velocity) {
        scheduleOnRN(onDismiss);
      } else {
        drag.value = withSpring(0, { dampingRatio: 0.8, duration: 400 });
      }
    },
  });

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const top = e.nativeEvent.contentOffset.y <= 2;
    if (top !== atTop) setAtTop(top);
  };

  const openMenu = () => {
    Alert.alert(formatLong(page.date), undefined, [
      { text: 'Edit', onPress: () => setEditing(true) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete this page?', 'It will be removed from this phone. This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const finishEditing = () => {
    setEditing(false);
    if (draft !== (entry?.text ?? '')) onSaveText(draft);
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, frame]}>
        <LinearGradient
          colors={[colors.paperLight, colors.paper]}
          style={StyleSheet.absoluteFill}
        />
        {/* Fold shading, fading out as the page lifts off the book. */}
        <Animated.View style={[StyleSheet.absoluteFill, foldStyle]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(60,52,56,0.10)', 'rgba(50,44,48,0.22)', 'rgba(60,52,56,0.10)', 'rgba(0,0,0,0)']}
            locations={[0.25, 0.45, 0.5, 0.55, 0.75]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* The page as it looked in the book. */}
        <Animated.View style={[StyleSheet.absoluteFill, smallText]} pointerEvents="none">
          <PageFace page={page} width={spreadW} height={spreadH} position={position} count={count} />
        </Animated.View>

        {/* The page at reading size. */}
        <Animated.View style={[styles.full, largeText]}>
          <View style={styles.topRow}>
            <Text style={styles.date}>{formatLong(page.date)}</Text>
            {editing ? (
              <Pressable onPress={finishEditing} hitSlop={10} accessibilityRole="button">
                <Text style={styles.done}>Done</Text>
              </Pressable>
            ) : (
              <Pressable onPress={openMenu} hitSlop={10} accessibilityRole="button" accessibilityLabel="Page options">
                <MoreIcon />
              </Pressable>
            )}
          </View>
          {entry?.audioUri && <VoiceNote uri={entry.audioUri} durationMs={entry.audioDurationMs} />}
          {editing ? (
            <TextInput
              value={draft}
              onChangeText={setDraft}
              multiline
              autoFocus
              placeholder="Write what you remember…"
              placeholderTextColor={colors.inkMuted}
              style={[styles.body, styles.input]}
              textAlignVertical="top"
            />
          ) : (
            <ScrollView onScroll={onScroll} scrollEventThrottle={32} contentContainerStyle={styles.scroll}>
              <Pressable onPress={() => setEditing(true)}>
                <Text style={[styles.body, !entry?.text && styles.placeholder]}>
                  {entry?.text || 'Tap to add words to this page.'}
                </Text>
              </Pressable>
            </ScrollView>
          )}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  full: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  date: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    color: colors.ink,
  },
  done: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  scroll: {
    paddingBottom: 60,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 27,
    color: colors.ink,
  },
  placeholder: {
    color: colors.inkMuted,
    fontFamily: fonts.bodyItalic,
  },
  input: {
    flex: 1,
    padding: 0,
    paddingBottom: 40,
  },
});
