import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDesktop } from './useDesktop';
import { useScreenSize } from './useScreenSize';

export const HEADER_HEIGHT = 128;
export const SHEET_COLLAPSED = 138;

/** Desktop web: width range of the docked calendar panel, and the gap beside it. */
const PANEL_MIN = 340;
const PANEL_MAX = 380;
const PANEL_GAP = 64;
const CONTENT_MAX = 1200;
const SIDE_MARGIN = 32;
/** Desktop web: space under the spread for the Record/Type pill and the helper line. */
const PILL_GAP = 18;
const PILL_HEIGHT = 68;
const FOOTER_HEIGHT = PILL_GAP + PILL_HEIGHT + 10 + 21;

/** Closed book height / width, and open spread width / closed book height (from the reference). */
const BOOK_ASPECT = 0.9 / 0.62;
const SPREAD_ASPECT = 1.04;

export type Frame = { left: number; top: number; width: number };

export type BookLayout = ReturnType<typeof useBookLayout>;

/**
 * Geometry shared by every scene. Proportions are taken from the reference
 * recording (closed book 0.62 W × 0.90 W, open spread 0.94 W × 1.18 W) and
 * scaled down on short screens so the spread always clears the calendar sheet.
 *
 * On a large browser window (desktop layout) the same proportions are fitted to
 * the window height instead, beside a docked calendar panel.
 */
export function useBookLayout() {
  const { width: W, height: H } = useScreenSize();
  const insets = useSafeAreaInsets();
  const desktop = useDesktop();

  return useMemo(() => {
    if (desktop) return desktopLayout(W, H, insets);

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
      desktop: false as boolean,
      /** Horizontal offset of the book and header while the book is closed (desktop only). */
      homeShift: 0,
      headerFrame: null as Frame | null,
      pillFrame: null as Frame | null,
      panelFrame: null as Frame | null,
    };
  }, [W, H, insets, desktop]);
}

function desktopLayout(W: number, H: number, insets: ReturnType<typeof useSafeAreaInsets>) {
  const contentW = Math.min(W - SIDE_MARGIN * 2, CONTENT_MAX);

  // Spread height: as tall as the window allows, at most 72% of it, and narrow
  // enough to leave room for the calendar panel inside the content width.
  const avail = H - insets.top - insets.bottom - 16 - HEADER_HEIGHT - 12 - FOOTER_HEIGHT - 24;
  let bookW = Math.min(avail, H * 0.72) / (2 * 0.95);
  bookW = Math.min(bookW, (contentW - PANEL_MIN - PANEL_GAP) / (BOOK_ASPECT * SPREAD_ASPECT));
  const bookH = bookW * BOOK_ASPECT;
  const spreadW = bookH * SPREAD_ASPECT;
  const spreadH = 2 * bookW * 0.95;

  // The open spread and the calendar panel are centred together in the window.
  const panelW = Math.max(PANEL_MIN, Math.min(PANEL_MAX, spreadW * 0.75, contentW - spreadW - PANEL_GAP));
  const groupW = spreadW + PANEL_GAP + panelW;
  const spreadLeft = (W - groupW) / 2;
  const centerX = spreadLeft + spreadW / 2;

  // Header, book and pill sit as one column, centred vertically.
  const column = HEADER_HEIGHT + 12 + spreadH + FOOTER_HEIGHT;
  const top = Math.max(insets.top + 16, (H - column) / 2);
  const headerBottom = top + HEADER_HEIGHT;
  const spreadTop = headerBottom + 12;
  const centerY = spreadTop + spreadH / 2;

  // Header and pill are centred over the book; the header's 20px padding lines
  // the settings button up with the spread's right edge (wider on short
  // windows so the title stays on one line).
  const columnW = Math.max(spreadW + 40, 420);
  const columnLeft = centerX - columnW / 2;
  // The pill row is wider so the helper line fits on one line.
  const footerW = Math.max(columnW, 560);

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
    spreadLeft,
    spreadTop,
    headerBottom,
    sheetTop: H,
    desktop: true as boolean,
    // With the calendar hidden, the closed book is centred in the window.
    homeShift: W / 2 - centerX,
    headerFrame: { left: columnLeft, top, width: columnW } as Frame | null,
    pillFrame: { left: centerX - footerW / 2, top: spreadTop + spreadH + PILL_GAP, width: footerW } as Frame | null,
    panelFrame: { left: spreadLeft + spreadW + PANEL_GAP, top: spreadTop, width: panelW } as Frame | null,
  };
}
