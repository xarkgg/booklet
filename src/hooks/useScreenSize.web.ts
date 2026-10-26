import { useWindowDimensions } from 'react-native';

/** Width of the centered phone column App.tsx renders on web. */
export const WEB_MAX_WIDTH = 480;

/** On web the app lives in a phone-width column: width is capped, height is the window's. */
export function useScreenSize() {
  const { width, height } = useWindowDimensions();
  return { width: Math.min(width, WEB_MAX_WIDTH), height };
}
