import type { MonthId } from "./month";

/** Recurring bills between paydays — rent, utilities, subscriptions, etc. */
export interface BillItem {
  id: string;
  label: string;
  amount: number;
}

export function totalBillsAmount(items: BillItem[]): number {
  return items.reduce((sum, i) => sum + i.amount, 0);
}

/** Every payday = counts toward take-home in each month. One-time = only in `oneTimeMonth`. */
export type IncomeRecurrence = "recurring" | "one_time";

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
  /**
   * Defaults to `recurring` when omitted (older backups).
   * `one_time` — e.g. loan repaid to you, one-off gig; use `oneTimeMonth` for which payday month it lands in.
   */
  recurrence?: IncomeRecurrence;
  /** Required when `recurrence` is `one_time`: the payday month this amount applies to. */
  oneTimeMonth?: MonthId;
}

/** Take-home for a given payday month (recurring streams + one-time streams tied to that month). */
export function incomeNgnForMonth(
  streams: IncomeStream[],
  month: MonthId,
): number {
  let sum = 0;
  for (const s of streams) {
    const amt = Math.max(0, s.amountNgn);
    if (amt <= 0) continue;
    const rec: IncomeRecurrence = s.recurrence ?? "recurring";
    if (rec === "recurring") {
      sum += amt;
    } else if (rec === "one_time" && s.oneTimeMonth === month) {
      sum += amt;
    }
  }
  return sum;
}

/** Sum of all stream amounts (ignores one-time vs recurring). Only for export sanity checks, not cushion math. */
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
