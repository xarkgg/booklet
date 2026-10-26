import { useWindowDimensions } from 'react-native';

/** Window size at which the web app switches from the phone column to the desktop layout. */
export const DESKTOP_MIN_WIDTH = 1024;
export const DESKTOP_MIN_HEIGHT = 640;

/** True when the browser window is big enough for the desktop layout. Updates live on resize. */
export function useDesktop() {
  const { width, height } = useWindowDimensions();
  return width >= DESKTOP_MIN_WIDTH && height >= DESKTOP_MIN_HEIGHT;
}
