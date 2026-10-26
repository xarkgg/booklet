import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import { PRESS } from '../animation/motion';
import { usePressFeedback } from '../animation/usePressFeedback';
import { HEADER_HEIGHT, type Frame } from '../hooks/useBookLayout';
import { colors, fonts } from '../theme';

type Props = {
  topInset: number;
  dateLabel: string;
  open: SharedValue<number>;
  /** 1 = visible, 0 = slid away (while a page is expanded). */
  chrome: SharedValue<number>;
  onTitlePress?: () => void;
  onMenuPress: () => void;
  /** Desktop web: where the header sits instead of spanning the top of the screen. */
  frame?: Frame | null;
};

function SlidersIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      {[5, 11, 17].map((x) => (
        <Line key={x} x1={x} y1={3} x2={x} y2={19} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      ))}
      <Circle cx={5} cy={13} r={2.2} fill={colors.bgTop} stroke={color} strokeWidth={1.5} />
      <Circle cx={11} cy={7} r={2.2} fill={colors.bgTop} stroke={color} strokeWidth={1.5} />
      <Circle cx={17} cy={14} r={2.2} fill={colors.bgTop} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

/**
 * Date line and serif heading. The two headings cross-fade with the book's
 * open progress, overlapping briefly as in the reference.
 */
export function Header({ topInset, dateLabel, open, chrome, onTitlePress, onMenuPress, frame }: Props) {
  const menuPress = usePressFeedback(PRESS.smallScale);
  const homeTitle = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0.05, 0.5], [1, 0], Extrapolation.CLAMP),
  }));
  const browseTitle = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0.05, 0.5], [0, 1], Extrapolation.CLAMP),
  }));
  const container = useAnimatedStyle(() => ({
    opacity: chrome.value,
    transform: [{ translateY: (1 - chrome.value) * -24 }],
  }));

  return (
    <Animated.View
      style={[
        styles.header,
        frame
          ? { left: frame.left, top: frame.top, width: frame.width, paddingTop: 10, height: HEADER_HEIGHT }
          : { paddingTop: topInset + 10, height: topInset + HEADER_HEIGHT },
        container,
      ]}
    >
      <View style={styles.dateRow}>
        <Text style={styles.date}>{dateLabel}</Text>
        <Pressable
          onPress={onMenuPress}
          {...menuPress.handlers}
          hitSlop={12}
          style={styles.menu}
          accessibilityRole="button"
          accessibilityLabel="Booklet settings"
        >
          <Animated.View style={menuPress.style}>
            <SlidersIcon color={colors.textMuted} />
          </Animated.View>
        </Pressable>
      </View>
      <Pressable onPress={onTitlePress} accessibilityRole="header" style={styles.titles}>
        <Animated.Text style={[styles.title, homeTitle]}>Here, your dreams{'\n'}come to life</Animated.Text>
        <Animated.Text style={[styles.title, styles.browse, browseTitle]}>Browse your dreams</Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 20,
  },
  dateRow: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  menu: {
    position: 'absolute',
    right: 0,
    top: 3,
  },
  titles: {
    marginTop: 10,
    height: 80,
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 38,
    color: colors.text,
  },
  browse: {
    letterSpacing: 0.8,
  },
});
