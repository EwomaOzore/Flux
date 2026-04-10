import type { MonthId } from './month';

/** Recurring bills between paydays — rent, utilities, subscriptions, etc. */
export interface BillItem {
  id: string;
  label: string;
  amount: number;
}

export function totalBillsAmount(items: BillItem[]): number {
  return items.reduce((sum, i) => sum + i.amount, 0);
}

export interface PaydayLine {
  id: string;
  month: MonthId;
  label: string;
  /** Positive = money leaving your account on that payday */
  amount: number;
}

export interface MonthRollup {
  month: MonthId;
  income: number;
  lines: PaydayLine[];
  totalPaydayOutflow: number;
  /** Sum of all bill items (same every month in the model). */
  billsTotal: number;
  remainderBeforeBills: number;
  cushionAfterBills: number;
}
