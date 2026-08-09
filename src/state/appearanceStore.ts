import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createSSRSafeJSONStorage } from '@/src/lib/ssrSafeStorage';

export type AppearancePreference = 'system' | 'light' | 'dark';

type AppearanceState = {
  preference: AppearancePreference;
  setPreference: (preference: AppearancePreference) => void;
};

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: 'flux-appearance-v1',
      storage: createSSRSafeJSONStorage(),
    },
  ),
);
