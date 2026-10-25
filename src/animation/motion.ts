import { Easing } from 'react-native-reanimated';

/**
 * Motion constants measured from the reference recording.
 * See docs/MOTION.md for where each number comes from.
 */
export const OPEN = {
  duration: 620,
  easing: Easing.bezier(0.45, 0, 0.2, 1),
  /** Fraction of the open progress over which the cover swings 0° → 180°. */
  coverEnd: 0.62,
  /** Total clockwise roll of the book, closed → open. */
  roll: 90,
  /** Peak forward lean (rotateX) mid-transition. */
  lean: 10,
  /** Local scale of the book once open (x is the book's width axis). */
  openScaleX: 0.95,
  openScaleY: 1.04,
  perspective: 1200,
} as const;

export const CHROME_OUT = { duration: 150, easing: Easing.in(Easing.quad) } as const;

export const SHEET_SPRING = { dampingRatio: 0.86, duration: 520 } as const;

export const PRESS = { scale: 0.96, duration: 120 } as const;
