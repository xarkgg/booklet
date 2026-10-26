import { useWindowDimensions } from 'react-native';

/** Size of the app's drawing area. On native this is the window. */
export function useScreenSize() {
  const { width, height } = useWindowDimensions();
  return { width, height };
}
