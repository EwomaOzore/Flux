import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createSSRSafeJSONStorage } from "@/src/lib/ssrSafeStorage";

type TourState = {
  /** True after the user finishes or skips the first-run guided tour. */
  hasCompletedTour: boolean;
  hydrated: boolean;
  /** When true, AppTourHost should present the tour (replay from Settings). */
  tourRequested: boolean;
};

type TourActions = {
  completeTour: () => void;
  requestTour: () => void;
  clearTourRequest: () => void;
};

export const useTourStore = create<TourState & TourActions>()(
  persist(
    (set) => ({
      hasCompletedTour: false,
      hydrated: false,
      tourRequested: false,
      completeTour: () => set({ hasCompletedTour: true, tourRequested: false }),
      requestTour: () => set({ tourRequested: true }),
      clearTourRequest: () => set({ tourRequested: false }),
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
