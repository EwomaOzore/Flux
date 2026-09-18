import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  DEFAULT_CURRENCY,
  isCurrencyCode,
  type CurrencyCode,
} from "@/src/lib/currencies";
import { createSSRSafeJSONStorage } from "@/src/lib/ssrSafeStorage";

const BUDGET_STORAGE_KEY = "flux-budget-v6";

type CurrencyState = {
  currencyCode: CurrencyCode;
  /** First name from onboarding — shown on Home. */
  displayName: string;
  /** False until the user picks a currency on first launch (or we detect an existing budget). */
  hasChosenCurrency: boolean;
  hydrated: boolean;
};

type CurrencyActions = {
  setCurrency: (code: CurrencyCode) => void;
  setDisplayName: (name: string) => void;
  completeOnboarding: (code: CurrencyCode, displayName: string) => void;
};

async function finishCurrencyHydration(state: CurrencyState | undefined) {
  let hasChosenCurrency = state?.hasChosenCurrency ?? false;
  if (!hasChosenCurrency && typeof window !== "undefined") {
    try {
      const existing = await AsyncStorage.getItem(BUDGET_STORAGE_KEY);
      if (existing) {
        hasChosenCurrency = true;
      }
    } catch {
      /* keep onboarding for brand-new installs */
    }
  }
  useCurrencyStore.setState({ hydrated: true, hasChosenCurrency });
}

export const useCurrencyStore = create<CurrencyState & CurrencyActions>()(
  persist(
    (set) => ({
      currencyCode: DEFAULT_CURRENCY,
      displayName: "",
      hasChosenCurrency: false,
      hydrated: false,
      setCurrency: (currencyCode) =>
        set({ currencyCode, hasChosenCurrency: true }),
      setDisplayName: (displayName) => set({ displayName: displayName.trim() }),
      completeOnboarding: (currencyCode, displayName) =>
        set({
          currencyCode,
          displayName: displayName.trim(),
          hasChosenCurrency: true,
        }),
    }),
    {
      name: "flux-currency-v1",
      storage: createSSRSafeJSONStorage(),
      partialize: (s) => ({
        currencyCode: s.currencyCode,
        displayName: s.displayName,
        hasChosenCurrency: s.hasChosenCurrency,
      }),
    },
  ),
);

useCurrencyStore.persist.onFinishHydration((state) => {
  void finishCurrencyHydration(state);
});

if (useCurrencyStore.persist.hasHydrated()) {
  void finishCurrencyHydration(useCurrencyStore.getState());
}

export function getCurrencyCode(): CurrencyCode {
  const code = useCurrencyStore.getState().currencyCode;
  return isCurrencyCode(code) ? code : DEFAULT_CURRENCY;
}
