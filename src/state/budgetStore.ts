import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { buildRollupsForMonths, sortedUniqueLineMonths } from '@/src/domain/engine';
import { currentPaydayMonthId, type MonthId } from '@/src/domain/month';
import type { PaydayLine } from '@/src/domain/types';

const STORAGE_KEY = 'flux-budget-v4';

export type BudgetState = {
  netSalary: number;
  staplesPerMonth: number;
  lines: PaydayLine[];
};

export type BudgetActions = {
  setNetSalary: (value: number) => void;
  setStaplesPerMonth: (value: number) => void;
  setLines: (lines: PaydayLine[]) => void;
  updateLine: (id: string, patch: Partial<Omit<PaydayLine, 'id'>>) => void;
  addLine: (line: Omit<PaydayLine, 'id'> & { id?: string }) => void;
  deleteLine: (id: string) => void;
  /** Clear lines and zeros income fields. */
  resetBudget: () => void;
};

const defaultState = (): BudgetState => ({
  netSalary: 0,
  staplesPerMonth: 0,
  lines: [],
});

export const useBudgetStore = create<BudgetState & BudgetActions>()(
  persist(
    (set) => ({
      ...defaultState(),
      setNetSalary: (value) => set({ netSalary: value }),
      setStaplesPerMonth: (value) => set({ staplesPerMonth: value }),
      setLines: (lines) => set({ lines }),
      updateLine: (id, patch) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),
      addLine: (line) =>
        set((s) => {
          const id = line.id ?? `line-${Date.now().toString(36)}`;
          const next: PaydayLine = {
            id,
            month: line.month,
            label: line.label,
            amount: line.amount,
          };
          return { lines: [...s.lines, next] };
        }),
      deleteLine: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      resetBudget: () => set(defaultState()),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);

/** Inputs that affect month rollups (narrower than full {@link BudgetState}). */
export type BudgetRollupDeps = Pick<BudgetState, 'netSalary' | 'staplesPerMonth' | 'lines'>;

export function computeRollups(state: BudgetRollupDeps) {
  const months = sortedUniqueLineMonths(state.lines);
  return buildRollupsForMonths(months, state.netSalary, state.staplesPerMonth, state.lines);
}

export function rollupForCurrentPayday(s: BudgetRollupDeps) {
  const cur = currentPaydayMonthId();
  const [rollup] = buildRollupsForMonths([cur], s.netSalary, s.staplesPerMonth, s.lines);
  return rollup;
}
