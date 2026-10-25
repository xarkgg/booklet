import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatLong, type DayKey } from '../lib/dates';
import { colors, fonts } from '../theme';
import { SheetModal } from './SheetModal';

type Props = {
  visible: boolean;
  day: DayKey;
  onSave: (text: string) => Promise<void>;
  onClosed: () => void;
};

/** "Type": a writing sheet for a new page. */
export function WriteSheet({ visible, day, onSave, onClosed }: Props) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const canSave = text.trim().length > 0 && !saving;

  const handleClosed = () => {
    setText('');
    setSaving(false);
    onClosed();
  };

  return (
    <SheetModal visible={visible} onClosed={handleClosed} dismissOnBackdrop={text.trim().length === 0}>
      {(close) => (
        <View>
          <View style={styles.row}>
            <Pressable onPress={close} hitSlop={10} accessibilityRole="button">
              <Text style={styles.secondary}>Cancel</Text>
            </Pressable>
            <Text style={styles.date}>{formatLong(day)}</Text>
            <Pressable
              disabled={!canSave}
              onPress={async () => {
                setSaving(true);
                try {
                  await onSave(text.trim());
                  close();
                } catch {
                  setSaving(false);
                }
              }}
              hitSlop={10}
              accessibilityRole="button"
            >
              <Text style={[styles.primary, !canSave && styles.disabled]}>Save</Text>
            </Pressable>
          </View>
          <View style={styles.paper}>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
              placeholder="What did you dream?"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              textAlignVertical="top"
              accessibilityLabel="Dream text"
            />
          </View>
        </View>
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  date: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  secondary: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textMuted,
  },
  primary: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.text,
  },
  disabled: {
    opacity: 0.35,
  },
  paper: {
    backgroundColor: colors.paper,
    borderRadius: 14,
    padding: 16,
    minHeight: 220,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 26,
    color: colors.ink,
    minHeight: 190,
    padding: 0,
  },
});
