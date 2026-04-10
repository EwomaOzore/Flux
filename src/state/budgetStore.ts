import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { buildMonthRollups } from '@/src/domain/engine';
import { compareMonthId, currentPaydayMonthId, type MonthId } from '@/src/domain/month';
import { applyIphoneSpread } from '@/src/domain/iphoneLines';
import { createSeedLines } from '@/src/domain/seed';
import type { IPhoneBalanceMonths, PaydayLine } from '@/src/domain/types';

const STORAGE_KEY = 'flux-budget-v1';

export type BudgetState = {
  netSalary: number;
  staplesPerMonth: number;
  planFromMonth: MonthId;
  planToMonth: MonthId;
  iphoneBalanceMonths: IPhoneBalanceMonths;
  iphoneFirstBalanceMonth: MonthId;
  lines: PaydayLine[];
};

export type BudgetActions = {
  setNetSalary: (value: number) => void;
  setStaplesPerMonth: (value: number) => void;
  setPlanRange: (from: MonthId, to: MonthId) => void;
  setIPhoneBalanceMonths: (months: IPhoneBalanceMonths) => void;
  setIPhoneFirstBalanceMonth: (month: MonthId) => void;
  setLines: (lines: PaydayLine[]) => void;
  updateLine: (id: string, patch: Partial<Omit<PaydayLine, 'id'>>) => void;
  addLine: (line: Omit<PaydayLine, 'id'> & { id?: string }) => void;
  deleteLine: (id: string) => void;
  resetDemoScenario: () => void;
};

const defaultState = (): BudgetState => ({
  netSalary: 1_585_333,
  staplesPerMonth: 256_250,
  planFromMonth: '2026-04',
  planToMonth: '2026-12',
  iphoneBalanceMonths: 2,
  iphoneFirstBalanceMonth: '2026-06',
  lines: createSeedLines(2, '2026-06'),
});

export const useBudgetStore = create<BudgetState & BudgetActions>()(
  persist(
    (set) => ({
      ...defaultState(),
      setNetSalary: (value) => set({ netSalary: value }),
      setStaplesPerMonth: (value) => set({ staplesPerMonth: value }),
      setPlanRange: (from, to) =>
        set(
          compareMonthId(from, to) <= 0
            ? { planFromMonth: from, planToMonth: to }
            : { planFromMonth: to, planToMonth: from }
        ),
      setIPhoneBalanceMonths: (iphoneBalanceMonths) =>
        set((s) => ({
          iphoneBalanceMonths,
          lines: applyIphoneSpread(s.lines, s.iphoneFirstBalanceMonth, iphoneBalanceMonths),
        })),
      setIPhoneFirstBalanceMonth: (iphoneFirstBalanceMonth) =>
        set((s) => ({
          iphoneFirstBalanceMonth,
          lines: applyIphoneSpread(s.lines, iphoneFirstBalanceMonth, s.iphoneBalanceMonths),
        })),
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
      resetDemoScenario: () => set(defaultState()),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);

export function computeRollups(state: BudgetState) {
  return buildMonthRollups({
    netSalary: state.netSalary,
    staplesPerMonth: state.staplesPerMonth,
    lines: state.lines,
    fromMonth: state.planFromMonth,
    toMonth: state.planToMonth,
  });
}

export function selectRollupsForStore(s: BudgetState) {
  return computeRollups(s);
}

export function rollupForCurrentPayday(s: BudgetState) {
  const cur = currentPaydayMonthId();
  const rollups = computeRollups(s);
  return rollups.find((r) => r.month === cur) ?? rollups[0];
}
