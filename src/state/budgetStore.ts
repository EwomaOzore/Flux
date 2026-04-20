import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { buildRollupsFromStreams, monthsForRollups } from '@/src/domain/engine';
import { compareMonthId, currentPaydayMonthId, monthRangeInclusive, type MonthId } from '@/src/domain/month';
import type { BillItem, IncomeStream, PaydayLine } from '@/src/domain/types';
import { totalBillsAmount } from '@/src/domain/types';

const STORAGE_KEY = 'flux-budget-v6';

export type BudgetState = {
  incomeStreams: IncomeStream[];
  billItems: BillItem[];
  lines: PaydayLine[];
};

export type BudgetActions = {
  setIncomeStreams: (streams: IncomeStream[]) => void;
  addIncomeStream: (item: Omit<IncomeStream, 'id'> & { id?: string }) => void;
  updateIncomeStream: (id: string, patch: Partial<Omit<IncomeStream, 'id'>>) => void;
  removeIncomeStream: (id: string) => void;
  setBillItems: (items: BillItem[]) => void;
  addBill: (item: Omit<BillItem, 'id'> & { id?: string }) => void;
  updateBill: (id: string, patch: Partial<Omit<BillItem, 'id'>>) => void;
  deleteBill: (id: string) => void;
  setLines: (lines: PaydayLine[]) => void;
  updateLine: (id: string, patch: Partial<Omit<PaydayLine, 'id'>>) => void;
  addLine: (line: Omit<PaydayLine, 'id'> & { id?: string }) => void;
  deleteLine: (id: string) => void;
  /** Clears lines, bills, and income streams. */
  resetBudget: () => void;
};

const defaultState = (): BudgetState => ({
  incomeStreams: [],
  billItems: [],
  lines: [],
});

type LegacyPersistedSlice = {
  netSalary?: number;
  incomeStreams?: IncomeStream[];
  essentialItems?: BillItem[];
  billItems?: BillItem[];
  lines?: PaydayLine[];
};

export const useBudgetStore = create<BudgetState & BudgetActions>()(
  persist(
    (set) => ({
      ...defaultState(),
      setIncomeStreams: (incomeStreams) => set({ incomeStreams }),
      addIncomeStream: (item) =>
        set((s) => {
          const id = item.id ?? `income-${Date.now().toString(36)}`;
          const recurrence = item.recurrence ?? 'recurring';
          const next: IncomeStream = {
            id,
            label: item.label,
            amountNgn: item.amountNgn,
            note: item.note,
            recurrence,
            ...(recurrence === 'one_time'
              ? { oneTimeMonth: item.oneTimeMonth ?? currentPaydayMonthId() }
              : {}),
          };
          return { incomeStreams: [...s.incomeStreams, next] };
        }),
      updateIncomeStream: (id, patch) =>
        set((s) => ({
          incomeStreams: s.incomeStreams.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeIncomeStream: (id) =>
        set((s) => ({ incomeStreams: s.incomeStreams.filter((x) => x.id !== id) })),
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
      version: 4,
      migrate: (persistedState, fromVersion) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState as BudgetState;
        }

        let state = persistedState as unknown as Record<string, unknown>;

        if (fromVersion < 2) {
          const s = state as unknown as LegacyPersistedSlice;
          if (Array.isArray(s.essentialItems)) {
            const { essentialItems: _drop, ...rest } = s;
            state = { ...rest, billItems: s.essentialItems } as Record<string, unknown>;
          }
        }

        if (fromVersion < 3) {
          const legacy = state as unknown as LegacyPersistedSlice & { netSalary?: number };
          const streams: IncomeStream[] =
            Array.isArray(legacy.incomeStreams) && legacy.incomeStreams.length > 0
              ? legacy.incomeStreams
              : typeof legacy.netSalary === 'number' && legacy.netSalary > 0
                ? [{ id: 'migrated-net', label: 'Net pay', amountNgn: legacy.netSalary }]
                : [];
          const { netSalary: _dropNet, ...rest } = legacy as Record<string, unknown>;
          state = { ...rest, incomeStreams: streams } as Record<string, unknown>;
        }

        if (fromVersion < 4) {
          const s = state as unknown as BudgetState;
          if (Array.isArray(s.incomeStreams)) {
            state = {
              ...state,
              incomeStreams: s.incomeStreams.map((st) =>
                st.recurrence ? st : { ...st, recurrence: 'recurring' as const },
              ),
            } as Record<string, unknown>;
          }
        }

        return state as unknown as BudgetState;
      },
    }
  )
);

/** Inputs that affect month rollups (narrower than full {@link BudgetState}). */
export type BudgetRollupDeps = Pick<BudgetState, 'incomeStreams' | 'billItems' | 'lines'>;

export function computeRollups(state: BudgetRollupDeps) {
  const months = monthsForRollups(state.lines, state.incomeStreams);
  const billsTotal = totalBillsAmount(state.billItems);
  return buildRollupsFromStreams(months, state.incomeStreams, billsTotal, state.lines);
}

export function rollupsThroughMonth(s: BudgetRollupDeps, throughMonth: MonthId) {
  const relevant = monthsForRollups(s.lines, s.incomeStreams).filter(
    (m) => compareMonthId(m, throughMonth) <= 0
  );
  const start = relevant.length > 0 ? relevant[0] : throughMonth;
  const months = monthRangeInclusive(start, throughMonth);
  const billsTotal = totalBillsAmount(s.billItems);
  return buildRollupsFromStreams(months, s.incomeStreams, billsTotal, s.lines);
}

export function rollupForCurrentPayday(s: BudgetRollupDeps) {
  const cur = currentPaydayMonthId();
  const rolls = rollupsThroughMonth(s, cur);
  return rolls.at(-1);
}
