import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";

import { AppTourOverlay } from "@/components/AppTourOverlay";
import { matchesTourRoute, TOUR_STEPS } from "@/src/lib/tourSteps";
import { useBudgetStore } from "@/src/state/budgetStore";
import { useCurrencyStore } from "@/src/state/currencyStore";
import { useTourStore, type TourBaseline } from "@/src/state/tourStore";
import { useShallow } from "zustand/react/shallow";

function snapshotBaseline(
  incomes: { amountNgn: number }[],
  bills: { amount: number }[],
  lines: unknown[],
): TourBaseline {
  return {
    incomesWithAmount: incomes.filter((s) => s.amountNgn > 0).length,
    billsWithAmount: bills.filter((b) => b.amount > 0).length,
    linesCount: lines.length,
  };
}

/**
 * Starts the interactive overlay tour after onboarding (or from Settings),
 * and advances steps when the user navigates / commits the required action.
 */
export function AppTourHost() {
  const pathname = usePathname();
  const currencyHydrated = useCurrencyStore((s) => s.hydrated);
  const hasChosenCurrency = useCurrencyStore((s) => s.hasChosenCurrency);

  const tourHydrated = useTourStore((s) => s.hydrated);
  const hasCompletedTour = useTourStore((s) => s.hasCompletedTour);
  const active = useTourStore((s) => s.active);
  const stepIndex = useTourStore((s) => s.stepIndex);
  const baseline = useTourStore((s) => s.baseline);
  const cushionTapped = useTourStore((s) => s.cushionTapped);
  const sheetOpen = useTourStore((s) => s.sheetOpen);
  const startTour = useTourStore((s) => s.startTour);
  const advanceStep = useTourStore((s) => s.advanceStep);

  const budget = useBudgetStore(
    useShallow((s) => ({
      incomeStreams: s.incomeStreams,
      billItems: s.billItems,
      lines: s.lines,
    })),
  );

  const startedRef = useRef(false);

  // Auto-start after onboarding for first-time users.
  useEffect(() => {
    if (!currencyHydrated || !tourHydrated) return;
    if (!hasChosenCurrency) return;
    if (hasCompletedTour || active) return;
    if (pathname.includes("onboarding")) return;
    if (startedRef.current) return;
    startedRef.current = true;
    const t = setTimeout(() => {
      startTour(
        snapshotBaseline(budget.incomeStreams, budget.billItems, budget.lines),
      );
    }, 500);
    return () => clearTimeout(t);
  }, [
    currencyHydrated,
    tourHydrated,
    hasChosenCurrency,
    hasCompletedTour,
    active,
    pathname,
    startTour,
    budget.incomeStreams,
    budget.billItems,
    budget.lines,
  ]);

  // Advance when route / committed data / cushion tap satisfies the step.
  useEffect(() => {
    if (!active) return;
    const step = TOUR_STEPS[stepIndex];
    if (!step) return;

    const nextBaseline = snapshotBaseline(
      budget.incomeStreams,
      budget.billItems,
      budget.lines,
    );

    const req = step.require;
    let done = false;
    if (req.kind === "route") {
      done = matchesTourRoute(pathname, req.route);
    } else if (req.kind === "income") {
      // Wait until the sheet is closed so the next spotlight isn't hidden.
      done =
        !sheetOpen &&
        matchesTourRoute(pathname, "plan") &&
        nextBaseline.incomesWithAmount > baseline.incomesWithAmount;
    } else if (req.kind === "bill") {
      done =
        !sheetOpen &&
        matchesTourRoute(pathname, "plan") &&
        nextBaseline.billsWithAmount > baseline.billsWithAmount;
    } else if (req.kind === "line") {
      done =
        !sheetOpen &&
        matchesTourRoute(pathname, "home") &&
        nextBaseline.linesCount > baseline.linesCount;
    } else if (req.kind === "cushionTap") {
      done = matchesTourRoute(pathname, "home") && cushionTapped;
    }

    if (done) {
      advanceStep(nextBaseline);
    }
  }, [
    active,
    stepIndex,
    pathname,
    baseline,
    cushionTapped,
    sheetOpen,
    budget.incomeStreams,
    budget.billItems,
    budget.lines,
    advanceStep,
  ]);

  if (!active) return null;
  return <AppTourOverlay pathname={pathname} />;
}

/** Called from Settings → Take a tour. */
export function startGuidedTourFromSettings() {
  const budget = useBudgetStore.getState();
  useTourStore
    .getState()
    .startTour(
      snapshotBaseline(budget.incomeStreams, budget.billItems, budget.lines),
    );
}
