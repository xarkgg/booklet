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

export const CLOSE_SPRING = { dampingRatio: 0.62, duration: 760 } as const;

export const CHROME_OUT = { duration: 150, easing: Easing.in(Easing.quad) } as const;
export const SHEET_SPRING = { dampingRatio: 0.86, duration: 520 } as const;
export const CHROME_RETURN_SPRING = { dampingRatio: 0.7, duration: 520 } as const;

export const TURN = {
  /** Drag distance (as a fraction of the spread height) for a full turn. */
  dragFraction: 0.55,
  commitProgress: 0.35,
  commitVelocity: 600,
  duration: 300,
  easing: Easing.out(Easing.cubic),
  peelDegrees: 9,
} as const;

/**
 * Past the first or last page the leaf follows the finger with rubber-band
 * resistance and settles back. `maxDegrees` is the asymptote of the leaf angle;
 * `resistance` sets how fast it is approached (higher = stiffer).
 */
export const EDGE = {
  maxDegrees: 12,
  reducedMaxDegrees: 5,
  resistance: 2,
  spring: { damping: 22, stiffness: 220, mass: 1 },
  reducedReturn: { duration: 200, easing: Easing.bezier(0.23, 1, 0.32, 1) },
} as const;

export const EXPAND = {
  duration: 520,
  easing: Easing.bezier(0.3, 0, 0.1, 1),
  liftEnd: 0.35,
  liftScale: 0.97,
  inset: 6,
  radius: 14,
} as const;

export const COLLAPSE_SPRING = { dampingRatio: 0.86, duration: 560 } as const;
export const DISMISS = { distance: 120, velocity: 800 } as const;

/** Shared ease-out for small UI responses. */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/** Press feedback: scale on press-in, ease back on release. Reduced motion dims instead. */
export const PRESS = { scale: 0.97, smallScale: 0.95, duration: 140, releaseDuration: 160, reducedOpacity: 0.7 } as const;

/** Page text fades in when the visible page changes without a turn (new entry, day picked). */
export const REVEAL = { delay: 120, duration: 220 } as const;
