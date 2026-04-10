import type { MonthId } from './month';
import { compareMonthId, monthRangeInclusive } from './month';
import type { MonthRollup, PaydayLine } from './types';

export interface BuildPlanInput {
  netSalary: number;
  staplesPerMonth: number;
  lines: PaydayLine[];
  fromMonth: MonthId;
  toMonth: MonthId;
}

export function buildMonthRollups(input: BuildPlanInput): MonthRollup[] {
  const { netSalary, staplesPerMonth, lines, fromMonth, toMonth } = input;
  const months = monthRangeInclusive(fromMonth, toMonth);
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

export function boundsFromLines(lines: PaydayLine[]): { min?: MonthId; max?: MonthId } {
  if (lines.length === 0) return {};
  let min: MonthId = lines[0]!.month;
  let max: MonthId = lines[0]!.month;
  for (const l of lines) {
    if (compareMonthId(l.month, min) < 0) min = l.month;
    if (compareMonthId(l.month, max) > 0) max = l.month;
  }
  return { min, max };
}
