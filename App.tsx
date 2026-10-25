import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display/400Regular';
import { NotoSerif_400Regular } from '@expo-google-fonts/noto-serif/400Regular';
import { NotoSerif_400Regular_Italic } from '@expo-google-fonts/noto-serif/400Regular_Italic';
import { NotoSerif_500Medium } from '@expo-google-fonts/noto-serif/500Medium';
import { EntriesProvider } from './src/hooks/useEntries';
import { View } from 'react-native';
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

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bgBottom }}>
      <SafeAreaProvider>
        <EntriesProvider>
          <StatusBar style="light" />
          <View style={{ flex: 1 }} />
        </EntriesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
