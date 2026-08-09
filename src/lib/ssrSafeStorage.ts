import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

/** AsyncStorage wrapper that no-ops on the server (Expo web SSR). */
const ssrSafeAsyncStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    return AsyncStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    return AsyncStorage.setItem(name, value);
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    return AsyncStorage.removeItem(name);
  },
};

export function createSSRSafeJSONStorage() {
  return createJSONStorage(() => ssrSafeAsyncStorage);
}
