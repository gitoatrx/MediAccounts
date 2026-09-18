import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// expo-secure-store has no web implementation, so the web preview keeps the
// session in localStorage. The phone app keeps using the device's secure storage.
const KEY = 'mediaccounts.session';

export async function readSession() {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) ?? null;
  return SecureStore.getItemAsync(KEY);
}

export async function saveSession(token: string) {
  if (Platform.OS === 'web') { globalThis.localStorage?.setItem(KEY, token); return; }
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearSession() {
  if (Platform.OS === 'web') { globalThis.localStorage?.removeItem(KEY); return; }
  await SecureStore.deleteItemAsync(KEY);
}
