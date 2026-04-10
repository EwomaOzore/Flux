import type { MonthId } from './month';
import { compareMonthId } from './month';
import type { MonthRollup, PaydayLine } from './types';

/** Months that have at least one line item, earliest → latest. */
export function sortedUniqueLineMonths(lines: PaydayLine[]): MonthId[] {
  if (lines.length === 0) return [];
  const seen = new Set<MonthId>();
  for (const l of lines) {
    seen.add(l.month);
  }
  return [...seen].sort(compareMonthId);
}

export function buildRollupsForMonths(
  months: MonthId[],
  netSalary: number,
  staplesPerMonth: number,
  lines: PaydayLine[]
): MonthRollup[] {
  const linesByMonth = new Map<MonthId, PaydayLine[]>();

  for (const line of lines) {
    const existing = linesByMonth.get(line.month) ?? [];
    existing.push(line);
    linesByMonth.set(line.month, existing);
  }

  return months.map((month) => {
    const monthLines = (linesByMonth.get(month) ?? []).slice().sort((a, b) => a.label.localeCompare(b.label));
    const totalPaydayOutflow = monthLines.reduce((s, l) => s + l.amount, 0);
    const remainderBeforeStaples = netSalary - totalPaydayOutflow;
    const cushionAfterStaples = remainderBeforeStaples - staplesPerMonth;

    return {
      month,
      income: netSalary,
      lines: monthLines,
      totalPaydayOutflow,
      remainderBeforeStaples,
      cushionAfterStaples,
    };
  });
}
