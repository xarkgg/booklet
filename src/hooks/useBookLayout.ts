import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScreenSize } from './useScreenSize';

export const HEADER_HEIGHT = 128;
export const SHEET_COLLAPSED = 138;

export type BookLayout = ReturnType<typeof useBookLayout>;

/**
 * Geometry shared by every scene. Proportions are taken from the reference
 * recording (closed book 0.62 W × 0.90 W, open spread 0.94 W × 1.18 W) and
 * scaled down on short screens so the spread always clears the calendar sheet.
 */
export function useBookLayout() {
  const { width: W, height: H } = useScreenSize();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const headerBottom = insets.top + HEADER_HEIGHT;
    const sheetTop = H - insets.bottom - SHEET_COLLAPSED - 8;
    const avail = sheetTop - headerBottom - 24;

    let bookW = W * 0.62;
    let bookH = W * 0.9;
    const spreadHFor = (bw: number) => 2 * bw * 0.95;
    const k = Math.min(1, avail / spreadHFor(bookW));
    bookW *= k;
    bookH *= k;

    const spreadW = bookH * 1.04;
    const spreadH = spreadHFor(bookW);
    const centerY = headerBottom + 12 + avail / 2;
    const centerX = W / 2;

    return {
      W,
      H,
      insets,
      bookW,
      bookH,
      spreadW,
      spreadH,
      centerX,
      centerY,
      spreadLeft: centerX - spreadW / 2,
      spreadTop: centerY - spreadH / 2,
      headerBottom,
      sheetTop,
    };
  }, [W, H, insets]);
}
