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

/**
 * One income source (job, contract, etc.). Amounts are in **NGN** for budgeting math.
 * If you’re paid in USD/GBP/etc., convert to naira here and optionally note the original in `note`.
 */
export interface IncomeStream {
  id: string;
  label: string;
  amountNgn: number;
  /** Display-only, e.g. "$650 + £200 before conversion" */
  note?: string;
}

export function totalIncomeNgn(streams: IncomeStream[]): number {
  return streams.reduce((sum, s) => sum + Math.max(0, s.amountNgn), 0);
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
