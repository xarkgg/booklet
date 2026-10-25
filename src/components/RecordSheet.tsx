import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { discardTemp } from '../audio/storage';
import { formatDuration, formatLong, type DayKey } from '../lib/dates';
import { colors, fonts } from '../theme';
import { SheetModal } from './SheetModal';

type Props = {
  visible: boolean;
  day: DayKey;
  /** Receives the temporary file and its length; the caller files it away. */
  onSave: (tempUri: string, durationMs: number) => Promise<void>;
  onClosed: () => void;
};

type Phase = 'asking' | 'denied' | 'recording' | 'saving' | 'error';

const OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

/** "Record": records a voice note straight into the app's private storage. */
export function RecordSheet({ visible, day, onSave, onClosed }: Props) {
  if (!visible) return null;
  return <RecordSheetBody day={day} onSave={onSave} onClosed={onClosed} />;
}

function RecordSheetBody({ day, onSave, onClosed }: Omit<Props, 'visible'>) {
  const recorder = useAudioRecorder(OPTIONS);
  const state = useAudioRecorderState(recorder, 100);
  const [phase, setPhase] = useState<Phase>('asking');
  const finished = useRef(false);
  const level = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const permission = await requestRecordingPermissionsAsync();
      if (cancelled) return;
      if (!permission.granted) {
        setPhase('denied');
        return;
      }
      try {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        if (cancelled) return;
        recorder.record();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        setPhase('recording');
      } catch {
        if (!cancelled) setPhase('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recorder]);

  useEffect(() => {
    // Metering is in dBFS (about -60 silent … 0 loud).
    const db = state.metering ?? -60;
    const v = Math.max(0, Math.min(1, (db + 60) / 60));
    level.value = withTiming(v, { duration: 100 });
  }, [state.metering, level]);

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + level.value * 0.35 }],
    opacity: 0.25 + level.value * 0.5,
  }));

  const stopAndDiscard = async () => {
    if (finished.current) return;
    finished.current = true;
    try {
      if (recorder.isRecording) await recorder.stop();
    } catch {
      // Already stopped.
    }
    discardTemp(recorder.uri);
    await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
  };

  const save = async (close: () => void) => {
    if (finished.current) return;
    finished.current = true;
    setPhase('saving');
    const duration = state.durationMillis;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      const uri = recorder.uri;
      if (!uri) throw new Error('No recording file');
      await onSave(uri, duration);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      close();
    } catch {
      discardTemp(recorder.uri);
      setPhase('error');
    }
  };

  return (
    <SheetModal
      visible
      dismissOnBackdrop={false}
      onClosed={() => {
        stopAndDiscard().finally(onClosed);
      }}
    >
      {(close) => (
        <View style={styles.body}>
          <Text style={styles.date}>{formatLong(day)}</Text>
          {phase === 'denied' ? (
            <>
              <Text style={styles.message}>
                Booklet needs the microphone to record a dream. Recordings stay on this phone.
              </Text>
              <Pressable onPress={() => Linking.openSettings()} style={[styles.secondaryButton, styles.wide]}>
                <Text style={styles.secondaryLabel}>Open settings</Text>
              </Pressable>
              <Pressable onPress={close} style={styles.textButton}>
                <Text style={styles.textButtonLabel}>Close</Text>
              </Pressable>
            </>
          ) : phase === 'error' ? (
            <>
              <Text style={styles.message}>The recording could not be saved.</Text>
              <Pressable onPress={close} style={styles.textButton}>
                <Text style={styles.textButtonLabel}>Close</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.meter}>
                <Animated.View style={[styles.ring, ring]} />
                <View style={styles.dot} />
              </View>
              <Text style={styles.timer}>{formatDuration(state.durationMillis)}</Text>
              <Text style={styles.hint}>
                {phase === 'asking' ? 'Getting ready…' : phase === 'saving' ? 'Saving…' : 'Recording. Tell it while it is fresh.'}
              </Text>
              <View style={styles.actions}>
                <Pressable onPress={close} style={styles.secondaryButton} accessibilityRole="button">
                  <Text style={styles.secondaryLabel}>Discard</Text>
                </Pressable>
                <Pressable
                  onPress={() => save(close)}
                  disabled={phase !== 'recording'}
                  style={[styles.primaryButton, phase !== 'recording' && styles.disabled]}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryLabel}>Save</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    paddingBottom: 6,
  },
  date: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 18,
  },
  meter: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.danger,
  },
  dot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.danger,
  },
  timer: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.text,
    marginTop: 10,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 22,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
  },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.ink,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4a484d',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  secondaryLabel: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
  },
  textButton: {
    marginTop: 12,
    padding: 8,
  },
  textButtonLabel: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
  },
  disabled: {
    opacity: 0.4,
  },
  wide: {
    flex: 0,
  },
});
