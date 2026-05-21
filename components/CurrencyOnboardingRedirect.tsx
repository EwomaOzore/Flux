import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { useCurrencyStore } from "@/src/state/currencyStore";

/** Sends new users to currency onboarding before the main app. */
export function CurrencyOnboardingRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const hydrated = useCurrencyStore((s) => s.hydrated);
  const hasChosenCurrency = useCurrencyStore((s) => s.hasChosenCurrency);

  useEffect(() => {
    if (!hydrated) return;
    const onOnboarding = segments[0] === "onboarding";
    if (!hasChosenCurrency && !onOnboarding) {
      router.replace("/onboarding");
    } else if (hasChosenCurrency && onOnboarding) {
      router.replace("/(tabs)");
    }
  }, [hasChosenCurrency, hydrated, router, segments]);

  return null;
}
