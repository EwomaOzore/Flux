import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'flux-activity-log-v1';
const LIMIT = 80;

export type ActivityEntry = {
  id: string;
  at: string;
  action: string;
  detail?: string;
};

export async function listActivity(): Promise<ActivityEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActivityEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function logActivity(action: string, detail?: string): Promise<void> {
  try {
    const cur = await listActivity();
    const next: ActivityEntry = {
      id: `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      at: new Date().toISOString(),
      action,
      detail,
    };
    const merged = [next, ...cur].slice(0, LIMIT);
    await AsyncStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    /* noop */
  }
}
