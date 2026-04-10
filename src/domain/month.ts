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

/** Local noon on the 1st — stable for native date pickers. */
export function dateFromMonthId(id: MonthId): Date {
  const { year, month } = parseMonthId(id);
  return new Date(year, month - 1, 1, 12, 0, 0, 0);
}

/** Human-readable label, e.g. `'April, 2026'` (always uses UTC calendar month). */
export function formatMonthIdDisplay(id: MonthId, locale: string = 'en-US'): string {
  const { year, month } = parseMonthId(id);
  const d = new Date(Date.UTC(year, month - 1, 1));
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(d);
  return `${monthName}, ${year}`;
}

const EN_MONTHS_FULL = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

/**
 * Parse a month the user typed: `'April, 2026'`, `'April 2026'`, or legacy `'2026-04'`.
 */
export function parseMonthIdFromUserInput(raw: string): MonthId | null {
  const s = raw.trim().replace(/\s+/g, ' ');
  if (!s) return null;

  const iso = /^(\d{4})-(\d{2})$/.exec(s);
  if (iso) {
    const id = `${iso[1]}-${iso[2]}` as MonthId;
    try {
      parseMonthId(id);
      return id;
    } catch {
      return null;
    }
  }

  const text = /^([A-Za-z]+)\s*,?\s*(\d{4})$/.exec(s);
  if (!text) return null;
  const monthWord = text[1].toLowerCase();
  const year = Number(text[2]);
  if (!Number.isFinite(year) || year < 1 || year > 9999) return null;
  const monthIndex = EN_MONTHS_FULL.indexOf(monthWord as (typeof EN_MONTHS_FULL)[number]);
  if (monthIndex === -1) return null;
  return formatMonthId(year, monthIndex + 1);
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
