import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Svg, { Path, Rect } from 'react-native-svg';
import { formatDuration } from '../lib/dates';
import { colors, fonts } from '../theme';

/** Playback row for an entry's voice note. Plays from the local file only. */
export function VoiceNote({ uri, durationMs }: { uri: string; durationMs: number | null }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
  }, []);

  useEffect(() => {
    if (status.didJustFinish) {
      player.seekTo(0).catch(() => {});
    }
  }, [status.didJustFinish, player]);

  const total = status.duration > 0 ? status.duration * 1000 : durationMs ?? 0;
  const progress = total > 0 ? Math.min(1, (status.currentTime * 1000) / total) : 0;

  const toggle = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={toggle}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? 'Pause voice note' : 'Play voice note'}
      >
        <Svg width={14} height={14} viewBox="0 0 14 14">
          {status.playing ? (
            <>
              <Rect x={2.5} y={2} width={3} height={10} rx={1} fill={colors.paperLight} />
              <Rect x={8.5} y={2} width={3} height={10} rx={1} fill={colors.paperLight} />
            </>
          ) : (
            <Path d="M3.5 1.8v10.4L12 7 3.5 1.8Z" fill={colors.paperLight} />
          )}
        </Svg>
      </Pressable>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.time}>
        {formatDuration(status.playing || status.currentTime > 0 ? status.currentTime * 1000 : total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(58,55,57,0.08)',
    marginBottom: 16,
  },
  button: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(58,55,57,0.18)',
    overflow: 'hidden',
  },
  fill: {
    height: 3,
    backgroundColor: colors.ink,
  },
  time: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    minWidth: 38,
    textAlign: 'right',
  },
});
