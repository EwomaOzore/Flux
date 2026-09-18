import { usePathname } from "expo-router";
import { useEffect, useState } from "react";

import { AppTourModal } from "@/components/AppTourModal";
import { useCurrencyStore } from "@/src/state/currencyStore";
import { useTourStore } from "@/src/state/tourStore";

/**
 * Presents the guided tour after onboarding (first launch), or when
 * the user taps “Take a tour” in Settings.
 */
export function AppTourHost() {
  const pathname = usePathname();
  const currencyHydrated = useCurrencyStore((s) => s.hydrated);
  const hasChosenCurrency = useCurrencyStore((s) => s.hasChosenCurrency);
  const tourHydrated = useTourStore((s) => s.hydrated);
  const hasCompletedTour = useTourStore((s) => s.hasCompletedTour);
  const tourRequested = useTourStore((s) => s.tourRequested);
  const completeTour = useTourStore((s) => s.completeTour);
  const clearTourRequest = useTourStore((s) => s.clearTourRequest);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!currencyHydrated || !tourHydrated) return;
    if (!hasChosenCurrency) {
      setVisible(false);
      return;
    }

    const onOnboarding = pathname.includes("onboarding");
    if (onOnboarding) {
      setVisible(false);
      return;
    }

    if (tourRequested) {
      setVisible(true);
      return;
    }

    if (!hasCompletedTour) {
      const t = setTimeout(() => setVisible(true), 450);
      return () => clearTimeout(t);
    }

    setVisible(false);
  }, [
    currencyHydrated,
    tourHydrated,
    hasChosenCurrency,
    hasCompletedTour,
    tourRequested,
    pathname,
  ]);

  const onFinish = () => {
    setVisible(false);
    completeTour();
    clearTourRequest();
  };

  return <AppTourModal visible={visible} onFinish={onFinish} />;
}
