import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createSSRSafeJSONStorage } from "@/src/lib/ssrSafeStorage";
import { TOUR_STEPS } from "@/src/lib/tourSteps";

export type TourBaseline = {
  incomesWithAmount: number;
  billsWithAmount: number;
  linesCount: number;
};

type TourState = {
  hasCompletedTour: boolean;
  hydrated: boolean;
  /** Tour is currently running (overlay visible). */
  active: boolean;
  stepIndex: number;
  baseline: TourBaseline;
  /** Set when user taps the Home cushion during the cushion step. */
  cushionTapped: boolean;
  /**
   * True while an income/bill/outflow sheet is open during a commit step.
   * Hides the dim spotlight so the sheet stays usable.
   */
  sheetOpen: boolean;
};

type TourActions = {
  startTour: (baseline: TourBaseline) => void;
  completeTour: () => void;
  skipTour: () => void;
  advanceStep: (nextBaseline: TourBaseline) => void;
  markCushionTapped: () => void;
  setBaseline: (baseline: TourBaseline) => void;
  setTourSheetOpen: (open: boolean) => void;
};

const emptyBaseline: TourBaseline = {
  incomesWithAmount: 0,
  billsWithAmount: 0,
  linesCount: 0,
};

export const useTourStore = create<TourState & TourActions>()(
  persist(
    (set, get) => ({
      hasCompletedTour: false,
      hydrated: false,
      active: false,
      stepIndex: 0,
      baseline: emptyBaseline,
      cushionTapped: false,
      sheetOpen: false,
      startTour: (baseline) =>
        set({
          active: true,
          stepIndex: 0,
          baseline,
          cushionTapped: false,
          sheetOpen: false,
        }),
      completeTour: () =>
        set({
          hasCompletedTour: true,
          active: false,
          stepIndex: 0,
          cushionTapped: false,
          sheetOpen: false,
        }),
      skipTour: () =>
        set({
          hasCompletedTour: true,
          active: false,
          stepIndex: 0,
          cushionTapped: false,
          sheetOpen: false,
        }),
      advanceStep: (nextBaseline) => {
        const { stepIndex } = get();
        const next = stepIndex + 1;
        if (next >= TOUR_STEPS.length) {
          set({
            hasCompletedTour: true,
            active: false,
            stepIndex: 0,
            cushionTapped: false,
            sheetOpen: false,
          });
          return;
        }
        set({
          stepIndex: next,
          baseline: nextBaseline,
          cushionTapped: false,
          sheetOpen: false,
        });
      },
      markCushionTapped: () => set({ cushionTapped: true }),
      setBaseline: (baseline) => set({ baseline }),
      setTourSheetOpen: (sheetOpen) => set({ sheetOpen }),
    }),
    {
      name: "flux-tour-v1",
      storage: createSSRSafeJSONStorage(),
      partialize: (s) => ({
        hasCompletedTour: s.hasCompletedTour,
      }),
    },
  ),
);

useTourStore.persist.onFinishHydration(() => {
  useTourStore.setState({ hydrated: true });
});

if (useTourStore.persist.hasHydrated()) {
  useTourStore.setState({ hydrated: true });
}
