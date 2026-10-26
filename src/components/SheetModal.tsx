import { useCallback, useEffect, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SHEET_SPRING } from '../animation/motion';
import { useDesktop } from '../hooks/useDesktop';
import { colors } from '../theme';

type Props = {
  visible: boolean;
  onClosed: () => void;
  /** Render prop gets a `close` that animates the sheet away first. */
  children: (close: () => void) => ReactNode;
  dismissOnBackdrop?: boolean;
};

/**
 * Bottom sheet over a dimmed backdrop, with the same spring as the calendar sheet.
 * On a desktop browser window it is a centred dialog instead.
 */
export function SheetModal({ visible, onClosed, children, dismissOnBackdrop = true }: Props) {
  const insets = useSafeAreaInsets();
  const desktop = useDesktop();
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
  const panel = useAnimatedStyle(() =>
    desktop
      ? {
          opacity: Math.min(1, progress.value * 1.6),
          transform: [{ translateY: (1 - progress.value) * 32 }, { scale: 0.97 + progress.value * 0.03 }],
        }
      : { transform: [{ translateY: (1 - progress.value) * 520 }] },
  );

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
          <Pressable style={styles.fill} onPress={dismissOnBackdrop ? close : undefined} accessibilityLabel="Close" />
        </Animated.View>
        {desktop ? (
          <View style={styles.dialogWrap} pointerEvents="box-none">
            <Animated.View style={[styles.panel, styles.dialog, panel]}>{children(close)}</Animated.View>
          </View>
        ) : (
          <>
            <View style={styles.fill} pointerEvents="box-none" />
            <View style={styles.panelWrap}>
              <Animated.View style={[styles.panel, { paddingBottom: insets.bottom + 16 }, panel]}>
                <View style={styles.handle} />
                {children(close)}
              </Animated.View>
            </View>
          </>
        )}
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
  // On web the sheet matches the app's centered 480px column.
  panelWrap: Platform.select({
    web: { width: '100%', maxWidth: 480, alignSelf: 'center' },
    default: {},
  }),
  panel: {
    marginHorizontal: 8,
    backgroundColor: colors.sheet,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
  },
  dialogWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 520,
    marginHorizontal: 0,
    borderRadius: 22,
    paddingTop: 18,
    paddingBottom: 18,
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
