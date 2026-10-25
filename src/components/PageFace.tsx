import { StyleSheet, Text, View } from 'react-native';
import type { Entry } from '../db/types';
import { formatDuration, formatLong, type DayKey } from '../lib/dates';
import { colors, fonts } from '../theme';

export type Page = {
  key: string;
  date: DayKey;
  entry: Entry | null;
};

type Props = {
  page: Page;
  width: number;
  height: number;
  position: number;
  count: number;
};

/** Text of one diary page, laid out over the full spread (both halves). */
export function PageFace({ page, width, height, position, count }: Props) {
  const { entry } = page;
  const pad = Math.round(width * 0.075);
  const hasVoice = !!entry?.audioUri;
  return (
    <View style={{ width, height, paddingHorizontal: pad, paddingTop: pad * 1.1, paddingBottom: pad * 0.8 }}>
      <Text style={styles.date}>{formatLong(page.date)}</Text>
      {entry ? (
        <>
          {hasVoice && (
            <Text style={styles.voice}>
              Voice note · {formatDuration(entry.audioDurationMs ?? 0)}
            </Text>
          )}
          {entry.text.length > 0 && (
            <Text style={styles.body} numberOfLines={Math.floor((height * 0.72) / 22)}>
              {entry.text}
            </Text>
          )}
        </>
      ) : (
        <Text style={styles.empty}>Nothing written yet.</Text>
      )}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{entry ? 'Tap to edit' : 'Tap to write'}</Text>
        {count > 0 && (
          <Text style={styles.footerText}>
            {position}/{count}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  date: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 10,
  },
  voice: {
    fontFamily: fonts.bodyItalic,
    fontSize: 12.5,
    color: colors.inkMuted,
    marginBottom: 6,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.ink,
  },
  empty: {
    fontFamily: fonts.bodyItalic,
    fontSize: 14,
    color: colors.inkMuted,
    opacity: 0.6,
  },
  footer: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.inkMuted,
    opacity: 0.75,
  },
});
