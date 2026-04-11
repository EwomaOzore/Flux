import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'flux-last-receipt-label';

export async function getLastReceiptLabel(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function setLastReceiptLabel(label: string): Promise<void> {
  const t = label.trim();
  if (!t) return;
  try {
    await AsyncStorage.setItem(KEY, t);
  } catch {
    /* ignore */
  }
}
