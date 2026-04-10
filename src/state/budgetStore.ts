import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { buildRollupsForMonths, sortedUniqueLineMonths } from '@/src/domain/engine';
import { currentPaydayMonthId } from '@/src/domain/month';
import type { BillItem, PaydayLine } from '@/src/domain/types';
import { totalBillsAmount } from '@/src/domain/types';

const STORAGE_KEY = 'flux-budget-v6';

export type BudgetState = {
  netSalary: number;
  billItems: BillItem[];
  lines: PaydayLine[];
};

export type BudgetActions = {
  setNetSalary: (value: number) => void;
  setBillItems: (items: BillItem[]) => void;
  addBill: (item: Omit<BillItem, 'id'> & { id?: string }) => void;
  updateBill: (id: string, patch: Partial<Omit<BillItem, 'id'>>) => void;
  deleteBill: (id: string) => void;
  setLines: (lines: PaydayLine[]) => void;
  updateLine: (id: string, patch: Partial<Omit<PaydayLine, 'id'>>) => void;
  addLine: (line: Omit<PaydayLine, 'id'> & { id?: string }) => void;
  deleteLine: (id: string) => void;
  /** Clears lines, bills, and zeros net pay. */
  resetBudget: () => void;
};

const defaultState = (): BudgetState => ({
  netSalary: 0,
  billItems: [],
  lines: [],
});

type LegacyPersistedSlice = {
  netSalary?: number;
  essentialItems?: BillItem[];
  billItems?: BillItem[];
  lines?: PaydayLine[];
};

export const useBudgetStore = create<BudgetState & BudgetActions>()(
  persist(
    (set) => ({
      ...defaultState(),
      setNetSalary: (value) => set({ netSalary: value }),
      setBillItems: (billItems) => set({ billItems }),
      addBill: (item) =>
        set((s) => {
          const id = item.id ?? `bill-${Date.now().toString(36)}`;
          const next: BillItem = {
            id,
            label: item.label,
            amount: item.amount,
          };
          return { billItems: [...s.billItems, next] };
        }),
      updateBill: (id, patch) =>
        set((s) => ({
          billItems: s.billItems.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteBill: (id) => set((s) => ({ billItems: s.billItems.filter((x) => x.id !== id) })),
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
      version: 2,
      migrate: (persistedState, fromVersion) => {
        if (fromVersion < 2 && persistedState && typeof persistedState === 'object') {
          const s = persistedState as LegacyPersistedSlice;
          if (Array.isArray(s.essentialItems)) {
            const { essentialItems: _drop, ...rest } = s;
            return {
              ...rest,
              billItems: s.essentialItems,
            } as BudgetState;
          }
        }
        return persistedState as BudgetState;
      },
    }
  )
);

/** Inputs that affect month rollups (narrower than full {@link BudgetState}). */
export type BudgetRollupDeps = Pick<BudgetState, 'netSalary' | 'billItems' | 'lines'>;

export function computeRollups(state: BudgetRollupDeps) {
  const months = sortedUniqueLineMonths(state.lines);
  const billsTotal = totalBillsAmount(state.billItems);
  return buildRollupsForMonths(months, state.netSalary, billsTotal, state.lines);
}

export function rollupForCurrentPayday(s: BudgetRollupDeps) {
  const cur = currentPaydayMonthId();
  const billsTotal = totalBillsAmount(s.billItems);
  const [rollup] = buildRollupsForMonths([cur], s.netSalary, billsTotal, s.lines);
  return rollup;
}
