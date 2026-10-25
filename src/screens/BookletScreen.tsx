import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSharedValue } from 'react-native-reanimated';
import { keepRecording } from '../audio/storage';
import { Header } from '../components/Header';
import { HomeFooter } from '../components/HomeFooter';
import { Notebook } from '../components/Notebook';
import { RecordSheet } from '../components/RecordSheet';
import { WriteSheet } from '../components/WriteSheet';
import { newId } from '../db/entries';
import { useBookLayout } from '../hooks/useBookLayout';
import { useEntries } from '../hooks/useEntries';
import { formatShort, todayKey } from '../lib/dates';
import { colors } from '../theme';

export function BookletScreen() {
  const layout = useBookLayout();
  const { entries, add, removeAll } = useEntries();

  const [writing, setWriting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [today, setToday] = useState(todayKey);

  const open = useSharedValue(0);
  const homeChrome = useSharedValue(1);
  const chrome = useSharedValue(1);

  // Keep "today" right if the app stays open past midnight.
  useEffect(() => {
    const id = setInterval(() => setToday(todayKey()), 60_000);
    return () => clearInterval(id);
  }, []);

  const saveText = useCallback(
    async (text: string) => {
      await add({ date: today, text });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
    [add, today],
  );

  const saveRecording = useCallback(
    async (tempUri: string, durationMs: number) => {
      const id = newId();
      const audioFile = keepRecording(tempUri, id);
      await add({ date: today, text: '', audioFile, audioDurationMs: durationMs }, id);
    },
    [add, today],
  );

  const showSettings = useCallback(() => {
    Alert.alert(
      'Booklet',
      `Your dreams are kept only on this phone. Nothing is uploaded, synced or tracked.\n\n${entries.length} ${entries.length === 1 ? 'page' : 'pages'} written.`,
      [
        { text: 'OK', style: 'cancel' },
        ...(entries.length > 0
          ? [
              {
                text: 'Delete all pages',
                style: 'destructive' as const,
                onPress: () =>
                  Alert.alert('Delete every page?', 'All text and voice notes will be erased from this phone.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete all',
                      style: 'destructive',
                      onPress: () => {
                        removeAll().catch(() => {});
                      },
                    },
                  ]),
              },
            ]
          : []),
      ],
    );
  }, [entries.length, removeAll]);

  const { insets } = layout;

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={StyleSheet.absoluteFill} />

      <Header
        topInset={insets.top}
        dateLabel={formatShort(new Date())}
        open={open}
        chrome={chrome}
        onMenuPress={showSettings}
      />

      <Notebook layout={layout} open={open} title="Dreams" subtitle="written by you" />

      <HomeFooter
        bottomInset={insets.bottom}
        shown={homeChrome}
        interactive
        onRecord={() => setRecording(true)}
        onType={() => setWriting(true)}
      />

      <WriteSheet visible={writing} day={today} onSave={saveText} onClosed={() => setWriting(false)} />
      <RecordSheet visible={recording} day={today} onSave={saveRecording} onClosed={() => setRecording(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBottom,
  },
});
