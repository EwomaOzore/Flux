import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "flux-biometric-lock-enabled";

export async function loadBiometricLockEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === "1";
  } catch {
    return false;
  }
}

export async function saveBiometricLockEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY, enabled ? "1" : "0");
}
