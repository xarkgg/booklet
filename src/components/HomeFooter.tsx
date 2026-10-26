import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { canRecord } from '../audio/canRecord';
import type { Frame } from '../hooks/useBookLayout';
import { colors, fonts } from '../theme';
import { ActionPill } from './ActionPill';

type Props = {
  bottomInset: number;
  /** 1 = shown on the home screen, 0 = dropped away while the book is open. */
  shown: SharedValue<number>;
  interactive: boolean;
  onRecord: () => void;
  onType: () => void;
  /**
   * Desktop web: the pill sits under the book (helper line below it) and stays
   * while the book is open; `pillShown` drives it, `shown` only the helper.
   */
  frame?: Frame | null;
  pillShown?: SharedValue<number>;
  /** Desktop web: keeps the pill no wider than the book above it. */
  pillMaxWidth?: number;
};

export function HomeFooter({ bottomInset, shown, interactive, onRecord, onType, frame, pillShown, pillMaxWidth = 340 }: Props) {
  const style = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: (1 - shown.value) * 40 }],
  }));
  const pillStyle = useAnimatedStyle(() => {
    const v = pillShown ? pillShown.value : 1;
    return { opacity: v, transform: [{ translateY: (1 - v) * 24 }] };
  });
  const helperStyle = useAnimatedStyle(() => ({ opacity: shown.value }));

  if (frame) {
    return (
      <Animated.View
        style={[styles.desktop, { left: frame.left, top: frame.top, width: frame.width }, pillStyle]}
        pointerEvents={interactive ? 'box-none' : 'none'}
      >
        <ActionPill onRecord={onRecord} onType={onType} maxWidth={pillMaxWidth} />
        <Animated.Text style={[styles.helper, styles.helperDesktop, helperStyle]} numberOfLines={1}>
          {canRecord
            ? 'Add a dream by simply recording a voice message or typing it out'
            : 'Add a dream by simply typing it out'}
        </Animated.Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[styles.footer, { paddingBottom: bottomInset + 14 }, style]}
      pointerEvents={interactive ? 'box-none' : 'none'}
    >
      <Text style={styles.helper}>
        {canRecord
          ? 'Add a dream by simply recording a\nvoice message or typing it out'
          : 'Add a dream by simply\ntyping it out'}
      </Text>
      <ActionPill onRecord={onRecord} onType={onType} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  desktop: {
    position: 'absolute',
  },
  helper: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 14,
  },
  helperDesktop: {
    marginTop: 10,
    marginBottom: 0,
  },
});
