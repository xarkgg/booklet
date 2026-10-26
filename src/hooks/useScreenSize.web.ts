import { useWindowDimensions } from 'react-native';
import { useDesktop } from './useDesktop';

/** Width of the centered phone column App.tsx renders on smaller browser windows. */
export const WEB_MAX_WIDTH = 480;

/**
 * On a large window the app uses the whole window (desktop layout). Otherwise it
 * lives in a phone-width column: width is capped, height is the window's.
 */
export function useScreenSize() {
  const { width, height } = useWindowDimensions();
  const desktop = useDesktop();
  return { width: desktop ? width : Math.min(width, WEB_MAX_WIDTH), height };
}
