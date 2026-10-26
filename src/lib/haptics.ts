import * as Haptics from 'expo-haptics';

export type ImpactStyle = 'light' | 'medium' | 'soft';

const IMPACT: Record<ImpactStyle, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  soft: Haptics.ImpactFeedbackStyle.Soft,
};

/** A physical knock. Failures (no haptic engine, low power) are ignored. */
export function impact(style: ImpactStyle) {
  Haptics.impactAsync(IMPACT[style]).catch(() => {});
}

/** The light tick used when choosing something. */
export function selection() {
  Haptics.selectionAsync().catch(() => {});
}

/** The "done" pattern after saving. */
export function success() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
