import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { colors, fonts } from '../theme';
import { ActionPill } from './ActionPill';

type Props = {
  bottomInset: number;
  /** 1 = shown on the home screen, 0 = dropped away while the book is open. */
  shown: SharedValue<number>;
  interactive: boolean;
  onRecord: () => void;
  onType: () => void;
};

export function HomeFooter({ bottomInset, shown, interactive, onRecord, onType }: Props) {
  const style = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: (1 - shown.value) * 40 }],
  }));
  return (
    <Animated.View
      style={[styles.footer, { paddingBottom: bottomInset + 14 }, style]}
      pointerEvents={interactive ? 'box-none' : 'none'}
    >
      <Text style={styles.helper}>
        Add a dream by simply recording a{'\n'}voice message or typing it out
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
  helper: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 14,
  },
});
