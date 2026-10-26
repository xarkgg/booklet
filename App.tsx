import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display/400Regular';
import { NotoSerif_400Regular } from '@expo-google-fonts/noto-serif/400Regular';
import { NotoSerif_400Regular_Italic } from '@expo-google-fonts/noto-serif/400Regular_Italic';
import { NotoSerif_500Medium } from '@expo-google-fonts/noto-serif/500Medium';
import { useDesktop } from './src/hooks/useDesktop';
import { EntriesProvider } from './src/hooks/useEntries';
import { AlertHost } from './src/lib/alert';
import { BookletScreen } from './src/screens/BookletScreen';
import { colors } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    NotoSerif_400Regular,
    NotoSerif_400Regular_Italic,
    NotoSerif_500Medium,
  });
  const ready = fontsLoaded || !!fontError;
  const desktop = useDesktop();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bgBottom }}>
      <SafeAreaProvider>
        <EntriesProvider>
          <StatusBar style="light" />
          {Platform.OS === 'web' ? (
            <View style={styles.webOuter}>
              <View style={[styles.webColumn, desktop && styles.webDesktop]}>
                <BookletScreen />
              </View>
            </View>
          ) : (
            <BookletScreen />
          )}
          <AlertHost />
        </EntriesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// On web the app renders as a phone-width column centered in the window, or
// across the whole window when it is large enough for the desktop layout.
const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.bgBottom,
  },
  webColumn: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
  },
  webDesktop: {
    maxWidth: '100%',
  },
});
