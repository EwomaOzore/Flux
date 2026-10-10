import AsyncStorage from "@react-native-async-storage/async-storage";
import { AndroidImportance } from "expo-notifications/build/NotificationChannelManager.types";
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from "expo-notifications/build/NotificationPermissions";
import { SchedulableTriggerInputTypes } from "expo-notifications/build/Notifications.types";
import { setNotificationHandler } from "expo-notifications/build/NotificationsHandler";
import { cancelScheduledNotificationAsync } from "expo-notifications/build/cancelScheduledNotificationAsync";
import { getAllScheduledNotificationsAsync } from "expo-notifications/build/getAllScheduledNotificationsAsync";
import { scheduleNotificationAsync } from "expo-notifications/build/scheduleNotificationAsync";
import { setNotificationChannelAsync } from "expo-notifications/build/setNotificationChannelAsync";
import { Platform } from "react-native";

/**
 * Import the local-notification files directly. The package entry also
 * registers a remote push-token listener, and that throws inside Android
 * Expo Go before any screen can load.
 */

const PREFS_KEY = "flux-payday-reminder-prefs";
const NOTIFICATION_ID = "flux-monthly-payday-reminder";
const NOTIFICATION_ID_EVE = "flux-monthly-payday-reminder-eve";

export type ReminderPrefs = {
  enabled: boolean;
  /** 1–31. On shorter months the OS typically fires on the last day. */
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
      dayOfMonth: Math.min(
        31,
        Math.max(1, Math.round(parsed.dayOfMonth ?? 25)),
      ),
      hour: Math.min(23, Math.max(0, Math.round(parsed.hour ?? 9))),
      minute: Math.min(59, Math.max(0, Math.round(parsed.minute ?? 0))),
      alsoRemindEve:
        typeof parsed.alsoRemindEve === "boolean"
          ? parsed.alsoRemindEve
          : defaultReminderPrefs().alsoRemindEve,
    };
  } catch {
    return defaultReminderPrefs();
  }
}

export async function saveReminderPrefs(prefs: ReminderPrefs): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS === "android") {
    await setNotificationChannelAsync("flux-default", {
      name: "Reminders",
      importance: AndroidImportance.DEFAULT,
    });
  }
}

/** Applies prefs: schedules or cancels the monthly local notification. */
export async function applyReminderPrefs(
  prefs: ReminderPrefs,
): Promise<boolean> {
  await saveReminderPrefs(prefs);
  await cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(() => {});
  await cancelScheduledNotificationAsync(NOTIFICATION_ID_EVE).catch(() => {});

  if (!prefs.enabled) {
    return true;
  }

  const { status } = await requestPermissionsAsync();
  if (status !== "granted") {
    return false;
  }

  await ensureAndroidChannel();

  const eveDay =
    prefs.alsoRemindEve && prefs.dayOfMonth > 1 ? prefs.dayOfMonth - 1 : null;

  if (eveDay != null) {
    await scheduleNotificationAsync({
      identifier: NOTIFICATION_ID_EVE,
      content: {
        title: "Flux",
        body: "Review Flux before money lands.",
      },
      trigger: {
        type: SchedulableTriggerInputTypes.MONTHLY,
        day: eveDay,
        hour: prefs.hour,
        minute: prefs.minute,
        channelId: Platform.OS === "android" ? "flux-default" : undefined,
      },
    });
  }

  await scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: "Flux — payday check-in",
      body: "Open Flux and confirm income, bills, and line items for this payday run.",
    },
    trigger: {
      type: SchedulableTriggerInputTypes.MONTHLY,
      day: prefs.dayOfMonth,
      hour: prefs.hour,
      minute: prefs.minute,
      channelId: Platform.OS === "android" ? "flux-default" : undefined,
    },
  });

  return true;
}

/** Re-schedule from storage (e.g. on app launch). */
export async function syncReminderFromStorage(): Promise<void> {
  const prefs = await loadReminderPrefs();
  await applyReminderPrefs(prefs);
}

const BILL_DUE_PREFIX = "flux-bill-due-";

type DueBill = {
  readonly id: string;
  readonly label: string;
  readonly amount: number;
  readonly dueDay?: number;
};

let billReminderQueue: Promise<void> = Promise.resolve();

/**
 * Each bill with a due day gets a monthly local reminder on that day.
 * Clearing the day or deleting the bill cancels it.
 */
export function syncBillDueReminders(
  bills: readonly DueBill[],
): Promise<"none" | "scheduled" | "denied"> {
  const snapshot = bills.map((bill) => ({
    id: bill.id,
    label: bill.label.trim() || "Bill",
    amount: bill.amount,
    dueDay: bill.dueDay,
  }));
  let result: "none" | "scheduled" | "denied" = "none";
  billReminderQueue = billReminderQueue
    .then(async () => {
      result = await applyBillDueReminders(snapshot);
    })
    .catch(() => {
      result = "none";
    });
  return billReminderQueue.then(() => result);
}

async function applyBillDueReminders(
  bills: readonly DueBill[],
): Promise<"none" | "scheduled" | "denied"> {
  const scheduled = await getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(
    scheduled
      .filter((item) => item.identifier.startsWith(BILL_DUE_PREFIX))
      .map((item) =>
        cancelScheduledNotificationAsync(item.identifier).catch(() => {}),
      ),
  );

  const dated = bills.filter(
    (bill): bill is DueBill & { dueDay: number } =>
      bill.amount > 0 &&
      bill.dueDay != null &&
      bill.dueDay >= 1 &&
      bill.dueDay <= 31,
  );
  if (dated.length === 0) return "none";

  const existing = await getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return "denied";

  await ensureAndroidChannel();
  const prefs = await loadReminderPrefs();

  for (const bill of dated) {
    await scheduleNotificationAsync({
      identifier: `${BILL_DUE_PREFIX}${bill.id}`,
      content: {
        title: "Flux — payment due",
        body: `${bill.label} is due today.`,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.MONTHLY,
        day: bill.dueDay,
        hour: prefs.hour,
        minute: prefs.minute,
        channelId: Platform.OS === "android" ? "flux-default" : undefined,
      },
    });
  }

  return "scheduled";
}
