import { useSyncExternalStore } from 'react';
import { Alert as NativeAlert, Modal, Pressable, StyleSheet, Text, View, type AlertButton } from 'react-native';
import { colors, fonts } from '../theme';

/**
 * React Native Web's Alert does nothing, so the web build draws its own
 * dialog. `Alert.alert` queues a dialog in a module-level store and
 * `<AlertHost />` (mounted once in App) renders the one in front.
 */
type Dialog = { id: number; title: string; message?: string; buttons: AlertButton[] };

let queue: Dialog[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => queue;

export const Alert: { alert: typeof NativeAlert.alert } = {
  alert: (title, message, buttons) => {
    queue = [
      ...queue,
      { id: nextId++, title: title ?? '', message: message ?? undefined, buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }] },
    ];
    emit();
  },
};

function dismiss(dialog: Dialog, button?: AlertButton) {
  queue = queue.filter((d) => d.id !== dialog.id);
  emit();
  // Run after removing, so a button that opens another dialog shows it next.
  button?.onPress?.();
}

function cancel(dialog: Dialog) {
  dismiss(dialog, dialog.buttons.find((b) => b.style === 'cancel'));
}

export function AlertHost() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)[0];
  if (!current) return null;
  const stacked = current.buttons.length > 2;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => cancel(current)}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => cancel(current)} accessibilityLabel="Dismiss" />
        <View style={styles.dialog} accessibilityRole="alert">
          <Text style={styles.title}>{current.title}</Text>
          {current.message ? <Text style={styles.message}>{current.message}</Text> : null}
          <View style={[styles.buttons, stacked && styles.buttonsStacked]}>
            {current.buttons.map((b, i) => (
              <Pressable
                key={`${b.text ?? ''}-${i}`}
                onPress={() => dismiss(current, b)}
                style={({ pressed }) => [
                  styles.button,
                  !stacked && styles.buttonRow,
                  b.style === 'cancel' && styles.buttonCancel,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.buttonLabel,
                    b.style === 'destructive' && styles.destructive,
                    b.style === 'cancel' && styles.cancelLabel,
                  ]}
                >
                  {b.text ?? 'OK'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    backgroundColor: colors.sheet,
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  buttonsStacked: {
    flexDirection: 'column',
  },
  button: {
    height: 46,
    borderRadius: 23,
    backgroundColor: '#4a484d',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  buttonRow: {
    flex: 1,
  },
  buttonCancel: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.7,
  },
  buttonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15.5,
    color: colors.text,
  },
  destructive: {
    color: colors.danger,
  },
  cancelLabel: {
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
});
