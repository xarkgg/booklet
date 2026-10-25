import { useCallback, useEffect, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SHEET_SPRING } from '../animation/motion';
import { colors } from '../theme';

type Props = {
  visible: boolean;
  onClosed: () => void;
  /** Render prop gets a `close` that animates the sheet away first. */
  children: (close: () => void) => ReactNode;
  dismissOnBackdrop?: boolean;
};

/** Bottom sheet over a dimmed backdrop, with the same spring as the calendar sheet. */
export function SheetModal({ visible, onClosed, children, dismissOnBackdrop = true }: Props) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) progress.value = withSpring(1, SHEET_SPRING);
  }, [visible, progress]);

  const close = useCallback(() => {
    progress.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) scheduleOnRN(onClosed);
    });
  }, [onClosed, progress]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value * 0.55 }));
  const panel = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 520 }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
          <Pressable style={styles.fill} onPress={dismissOnBackdrop ? close : undefined} accessibilityLabel="Close" />
        </Animated.View>
        <View style={styles.fill} pointerEvents="box-none" />
        <Animated.View style={[styles.panel, { paddingBottom: insets.bottom + 16 }, panel]}>
          <View style={styles.handle} />
          {children(close)}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: '#000',
  },
  panel: {
    marginHorizontal: 8,
    backgroundColor: colors.sheet,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.sheetHandle,
    marginTop: 8,
    marginBottom: 12,
  },
});
