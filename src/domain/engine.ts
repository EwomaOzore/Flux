import type { MonthId } from "./month";
import { compareMonthId, monthRangeInclusive } from "./month";
import {
  incomeNgnForMonth,
  type IncomeStream,
  type MonthRollup,
  type PaydayLine,
} from "./types";

/** Months that have at least one line item, earliest → latest. */
export function sortedUniqueLineMonths(lines: PaydayLine[]): MonthId[] {
  if (lines.length === 0) return [];
  const seen = new Set<MonthId>();
  for (const l of lines) {
    seen.add(l.month);
  }
  return [...seen].sort(compareMonthId);
}

/** Union of months that have lines or one-time income scheduled — for timeline rollups. */
export function monthsForRollups(
  lines: PaydayLine[],
  incomeStreams: IncomeStream[],
): MonthId[] {
  const seen = new Set<MonthId>();
  for (const l of lines) seen.add(l.month);
  for (const s of incomeStreams) {
    if (s.recurrence === "one_time" && s.oneTimeMonth) {
      seen.add(s.oneTimeMonth);
    }
  }
  return [...seen].sort(compareMonthId);
}

export function buildRollupsForMonths(
  months: MonthId[],
  incomeForMonth: (month: MonthId) => number,
  billsTotal: number,
  lines: PaydayLine[],
): MonthRollup[] {
  if (months.length === 0) return [];
  const requested = [...new Set(months)].sort(compareMonthId);
  const fullRange = monthRangeInclusive(
    requested[0],
    requested.at(-1) ?? requested[0],
  );
  const linesByMonth = new Map<MonthId, PaydayLine[]>();

  for (const line of lines) {
    const existing = linesByMonth.get(line.month) ?? [];
    existing.push(line);
    linesByMonth.set(line.month, existing);
  }

  let carryFromPrevious = 0;
  const byMonth = new Map<MonthId, MonthRollup>();
  for (const month of fullRange) {
    const monthLines = (linesByMonth.get(month) ?? [])
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label));
    const totalPaydayOutflow = monthLines.reduce((s, l) => s + l.amount, 0);
    const income = incomeForMonth(month);
    const remainderBeforeBills =
      carryFromPrevious + income - totalPaydayOutflow;
    const cushionAfterBills = remainderBeforeBills - billsTotal;

    byMonth.set(month, {
      month,
      income,
      lines: monthLines,
      totalPaydayOutflow,
      billsTotal,
      remainderBeforeBills,
      cushionAfterBills,
    });
    carryFromPrevious = cushionAfterBills;
  }
  return requested.map((m) => byMonth.get(m)).filter(Boolean) as MonthRollup[];
}

/** Convenience: rollups using {@link incomeNgnForMonth} from streams. */
export function buildRollupsFromStreams(
  months: MonthId[],
  incomeStreams: IncomeStream[],
  billsTotal: number,
  lines: PaydayLine[],
): MonthRollup[] {
  return buildRollupsForMonths(
    months,
    (m) => incomeNgnForMonth(incomeStreams, m),
    billsTotal,
    lines,
  );
}
