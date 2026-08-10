import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  DEFAULT_CURRENCY,
  type CurrencyCode,
  isCurrencyCode,
} from "@/src/lib/currencies";
import { createSSRSafeJSONStorage } from "@/src/lib/ssrSafeStorage";

const BUDGET_STORAGE_KEY = "flux-budget-v6";

type CurrencyState = {
  currencyCode: CurrencyCode;
  /** False until the user picks a currency on first launch (or we detect an existing budget). */
  hasChosenCurrency: boolean;
  hydrated: boolean;
};

type CurrencyActions = {
  setCurrency: (code: CurrencyCode) => void;
  completeOnboarding: (code: CurrencyCode) => void;
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
      hasChosenCurrency: false,
      hydrated: false,
      setCurrency: (currencyCode) => set({ currencyCode, hasChosenCurrency: true }),
      completeOnboarding: (currencyCode) =>
        set({ currencyCode, hasChosenCurrency: true }),
    }),
    {
      name: "flux-currency-v1",
      storage: createSSRSafeJSONStorage(),
      partialize: (s) => ({
        currencyCode: s.currencyCode,
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
