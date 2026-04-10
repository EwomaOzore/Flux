import type { MonthId } from './month';
import { addMonthsId } from './month';
import type { IPhoneBalanceMonths, PaydayLine } from './types';

export const IPHONE_BALANCE_LINE_PREFIX = 'iphone-bal';

export function stripIphoneBalanceLines(lines: PaydayLine[]): PaydayLine[] {
  return lines.filter((l) => !l.id.startsWith(IPHONE_BALANCE_LINE_PREFIX));
}

/** Remaining 60% split evenly across 2 or 3 paydays starting **firstBalanceMonth**. */
export function iphoneBalanceLines(
  firstBalanceMonth: MonthId,
  months: IPhoneBalanceMonths
): PaydayLine[] {
  const totalBalance = 1_170_000;
  const count = months;
  const each = Math.round(totalBalance / count);
  const rows: PaydayLine[] = [];
  let m: MonthId = firstBalanceMonth;
  let paid = 0;
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const amount = isLast ? totalBalance - paid : each;
    paid += amount;
    rows.push({
      id: `${IPHONE_BALANCE_LINE_PREFIX}-${m}`,
      month: m,
      label: `iPhone — balance (${i + 1}/${count})`,
      amount,
    });
    m = addMonthsId(m, 1);
  }
  return rows;
}

export function applyIphoneSpread(
  lines: PaydayLine[],
  firstBalanceMonth: MonthId,
  months: IPhoneBalanceMonths
): PaydayLine[] {
  return [...stripIphoneBalanceLines(lines), ...iphoneBalanceLines(firstBalanceMonth, months)];
}
