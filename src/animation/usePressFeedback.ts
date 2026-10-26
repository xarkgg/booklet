import { useCallback } from 'react';
import { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { EASE_OUT, PRESS } from './motion';

/**
 * Press feedback for a tappable: shrinks slightly on press-in and eases back on
 * release. With reduced motion it dims instead of scaling.
 * Spread `handlers` onto the Pressable and put `style` on an Animated.View inside it.
 */
export function usePressFeedback(scale: number = PRESS.scale) {
  const pressed = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const style = useAnimatedStyle(() =>
    reduceMotion
      ? { opacity: 1 - (1 - PRESS.reducedOpacity) * pressed.value }
      : { transform: [{ scale: 1 - (1 - scale) * pressed.value }] },
  );

  const onPressIn = useCallback(() => {
    pressed.value = withTiming(1, { duration: PRESS.duration, easing: EASE_OUT });
  }, [pressed]);
  const onPressOut = useCallback(() => {
    pressed.value = withTiming(0, { duration: PRESS.releaseDuration, easing: EASE_OUT });
  }, [pressed]);

  return { style, handlers: { onPressIn, onPressOut } };
}
