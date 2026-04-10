import type { MonthId } from './month';

export type IPhoneBalanceMonths = 2 | 3;

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
  remainderBeforeStaples: number;
  cushionAfterStaples: number;
}
