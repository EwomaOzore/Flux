export type DailySpend = {
  /** Calendar days from today until payday. `0` when payday is today. */
  readonly daysUntil: number;
  /** Cushion split across those days. `null` on payday itself. */
  readonly perDay: number | null;
  /** Day of the month the next payday actually falls on. */
  readonly paydayDay: number;
};

function atNoon(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function paydayInMonth(
  year: number,
  monthIndex: number,
  dayOfMonth: number,
): Date {
  const day = Math.min(dayOfMonth, lastDayOfMonth(year, monthIndex));
  return atNoon(year, monthIndex, day);
}

/** Next payday on `dayOfMonth`, clamped to short months and rolling forward after it passes. */
export function nextPaydayDate(dayOfMonth: number, now: Date): Date {
  const day = Math.min(31, Math.max(1, Math.round(dayOfMonth)));
  const today = atNoon(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = paydayInMonth(today.getFullYear(), today.getMonth(), day);
  if (thisMonth.getTime() >= today.getTime()) return thisMonth;

  const nextMonthIndex = today.getMonth() + 1;
  return paydayInMonth(
    today.getFullYear() + (nextMonthIndex > 11 ? 1 : 0),
    nextMonthIndex % 12,
    day,
  );
}

function calendarDaysUntil(from: Date, to: Date): number {
  const start = atNoon(from.getFullYear(), from.getMonth(), from.getDate());
  const end = atNoon(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/**
 * How much of `cushion` can be spent each day until the next payday.
 * Payday day comes from reminder settings (1–31).
 */
export function dailySpendUntilPayday(
  cushion: number,
  dayOfMonth: number,
  now: Date = new Date(),
): DailySpend {
  const payday = nextPaydayDate(dayOfMonth, now);
  const daysUntil = Math.max(0, calendarDaysUntil(now, payday));
  const safeCushion = Number.isFinite(cushion) ? cushion : 0;
  return {
    daysUntil,
    paydayDay: payday.getDate(),
    perDay: daysUntil === 0 ? null : Math.round(safeCushion / daysUntil),
  };
}
