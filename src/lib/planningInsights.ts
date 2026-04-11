import { addMonthsId, type MonthId } from '@/src/domain/month';
import type { PaydayLine } from '@/src/domain/types';

/**
 * Counts consecutive calendar months (walking backward from `startMonth`) that have
 * at least one payday line — a light “planning streak” without scoring amounts.
 */
export function planningStreakMonths(lines: PaydayLine[], startMonth: MonthId): number {
  let count = 0;
  let m: MonthId = startMonth;
  for (;;) {
    const has = lines.some((l) => l.month === m);
    if (!has) break;
    count += 1;
    m = addMonthsId(m, -1);
  }
  return count;
}
