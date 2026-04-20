import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "flux-widget-last-sync-at";

export async function saveWidgetLastSyncAt(iso: string): Promise<void> {
  await AsyncStorage.setItem(KEY, iso);
}

export async function loadWidgetLastSyncAt(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}
