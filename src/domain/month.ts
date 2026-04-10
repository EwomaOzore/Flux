export type MonthId = `${number}-${number}`;

export function parseMonthId(id: MonthId): { year: number; month: number } {
  const [y, m] = id.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) {
    throw new Error(`Invalid MonthId: ${id}`);
  }
  return { year: y, month: m };
}

export function formatMonthId(year: number, month: number): MonthId {
  return `${year}-${String(month).padStart(2, '0')}` as MonthId;
}

export function addMonthsId(id: MonthId, delta: number): MonthId {
  const { year, month } = parseMonthId(id);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return formatMonthId(d.getUTCFullYear(), d.getUTCMonth() + 1);
}

export function compareMonthId(a: MonthId, b: MonthId): number {
  const A = parseMonthId(a);
  const B = parseMonthId(b);
  if (A.year !== B.year) return A.year - B.year;
  return A.month - B.month;
}

export function monthIdFromDate(d: Date): MonthId {
  return formatMonthId(d.getFullYear(), d.getMonth() + 1);
}

/** Each row is the payday at the **end** of this calendar month. */
export function currentPaydayMonthId(now: Date = new Date()): MonthId {
  return monthIdFromDate(now);
}

export function monthRangeInclusive(from: MonthId, to: MonthId): MonthId[] {
  if (compareMonthId(from, to) > 0) return [];
  const out: MonthId[] = [];
  let cur: MonthId = from;
  for (;;) {
    out.push(cur);
    if (cur === to) break;
    cur = addMonthsId(cur, 1);
  }
  return out;
}
