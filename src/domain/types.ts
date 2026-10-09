import type { MonthId } from "./month";

/** Recurring bills between paydays — rent, utilities, subscriptions, etc. */
export interface BillItem {
  id: string;
  label: string;
  amount: number;
  /** Day of month this bill is due, 1–31. Omitted when the user has not set one. */
  dueDay?: number;
  /** Payday month this bill was checked off. A new month makes it outstanding again. */
  paidMonth?: MonthId;
}

export function totalBillsAmount(items: BillItem[]): number {
  return items.reduce((sum, i) => sum + i.amount, 0);
}

export function isPaidInMonth(
  paidMonth: MonthId | undefined,
  month: MonthId,
): boolean {
  return paidMonth === month;
}

/** Bills that are still unpaid in `month`. Paid marks for other months do not apply. */
export function outstandingBillsAmount(
  items: BillItem[],
  month: MonthId,
): number {
  return items.reduce((sum, item) => {
    if (item.amount <= 0 || isPaidInMonth(item.paidMonth, month)) return sum;
    return sum + item.amount;
  }, 0);
}

export function clampDueDay(day: number): number {
  return Math.min(31, Math.max(1, Math.round(day)));
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
    if (rec === "recurring" || (rec === "one_time" && s.oneTimeMonth === month)) {
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
  /** one_time = this specific month only, monthly = repeats from startMonth through endMonth. */
  recurrence?: "one_time" | "monthly";
  /** Start month for monthly recurrence; defaults to `month` when omitted. */
  startMonth?: MonthId;
  /** End month for monthly recurrence (inclusive); defaults to `startMonth` / `month` when omitted. */
  endMonth?: MonthId;
  /** Payday month this outflow was checked off. A later month counts it again. */
  paidMonth?: MonthId;
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
