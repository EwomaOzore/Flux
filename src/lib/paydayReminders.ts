import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const PREFS_KEY = 'flux-payday-reminder-prefs';
const NOTIFICATION_ID = 'flux-monthly-payday-reminder';
const NOTIFICATION_ID_EVE = 'flux-monthly-payday-reminder-eve';

export type ReminderPrefs = {
  enabled: boolean;
  /** 1–28 (avoid 29–31 so every month fires) */
  dayOfMonth: number;
  hour: number;
  minute: number;
  /** Second ping the calendar day before `dayOfMonth` (requires day ≥ 2). */
  alsoRemindEve: boolean;
};

export const defaultReminderPrefs = (): ReminderPrefs => ({
  enabled: false,
  dayOfMonth: 25,
  hour: 9,
  minute: 0,
  alsoRemindEve: false,
});

export async function loadReminderPrefs(): Promise<ReminderPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return defaultReminderPrefs();
    const parsed = JSON.parse(raw) as Partial<ReminderPrefs>;
    return {
      ...defaultReminderPrefs(),
      ...parsed,
      dayOfMonth: Math.min(28, Math.max(1, Math.round(parsed.dayOfMonth ?? 25))),
      hour: Math.min(23, Math.max(0, Math.round(parsed.hour ?? 9))),
      minute: Math.min(59, Math.max(0, Math.round(parsed.minute ?? 0))),
      alsoRemindEve: typeof parsed.alsoRemindEve === 'boolean' ? parsed.alsoRemindEve : defaultReminderPrefs().alsoRemindEve,
    };
  } catch {
    return defaultReminderPrefs();
  }
}

export async function saveReminderPrefs(prefs: ReminderPrefs): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('flux-default', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** Applies prefs: schedules or cancels the monthly local notification. */
export async function applyReminderPrefs(prefs: ReminderPrefs): Promise<boolean> {
  await saveReminderPrefs(prefs);
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID_EVE).catch(() => {});

  if (!prefs.enabled) {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    return false;
  }

  await ensureAndroidChannel();

  const eveDay =
    prefs.alsoRemindEve && prefs.dayOfMonth > 1 ? prefs.dayOfMonth - 1 : null;

  if (eveDay != null) {
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID_EVE,
      content: {
        title: 'Flux',
        body: 'Review Flux before money lands.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: eveDay,
        hour: prefs.hour,
        minute: prefs.minute,
        channelId: Platform.OS === 'android' ? 'flux-default' : undefined,
      },
    });
  }

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: 'Flux — payday check-in',
      body: 'Open Flux and confirm income, bills, and line items for this payday run.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day: prefs.dayOfMonth,
      hour: prefs.hour,
      minute: prefs.minute,
      channelId: Platform.OS === 'android' ? 'flux-default' : undefined,
    },
  });

  return true;
}

/** Re-schedule from storage (e.g. on app launch). */
export async function syncReminderFromStorage(): Promise<void> {
  const prefs = await loadReminderPrefs();
  await applyReminderPrefs(prefs);
}
