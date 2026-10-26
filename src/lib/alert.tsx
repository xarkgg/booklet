import { Alert as NativeAlert } from 'react-native';

/** Native dialogs: a straight passthrough to React Native's Alert. */
export const Alert: { alert: typeof NativeAlert.alert } = {
  alert: (...args) => NativeAlert.alert(...args),
};

/** Only the web build draws its own dialogs; on native this renders nothing. */
export function AlertHost() {
  return null;
}
