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
};

type TourActions = {
  startTour: (baseline: TourBaseline) => void;
  completeTour: () => void;
  skipTour: () => void;
  advanceStep: (nextBaseline: TourBaseline) => void;
  markCushionTapped: () => void;
  setBaseline: (baseline: TourBaseline) => void;
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
      startTour: (baseline) =>
        set({
          active: true,
          stepIndex: 0,
          baseline,
          cushionTapped: false,
        }),
      completeTour: () =>
        set({
          hasCompletedTour: true,
          active: false,
          stepIndex: 0,
          cushionTapped: false,
        }),
      skipTour: () =>
        set({
          hasCompletedTour: true,
          active: false,
          stepIndex: 0,
          cushionTapped: false,
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
          });
          return;
        }
        set({
          stepIndex: next,
          baseline: nextBaseline,
          cushionTapped: false,
        });
      },
      markCushionTapped: () => set({ cushionTapped: true }),
      setBaseline: (baseline) => set({ baseline }),
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
