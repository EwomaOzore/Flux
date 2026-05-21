import {
  currencyOption,
  type CurrencyCode,
  DEFAULT_CURRENCY,
} from "@/src/lib/currencies";
import { getCurrencyCode } from "@/src/state/currencyStore";

const formatterCache = new Map<CurrencyCode, Intl.NumberFormat>();

function formatterFor(code: CurrencyCode): Intl.NumberFormat {
  let fmt = formatterCache.get(code);
  if (!fmt) {
    const { locale } = currencyOption(code);
    fmt = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    });
    formatterCache.set(code, fmt);
  }
  return fmt;
}

export function formatMoney(amount: number, code?: CurrencyCode): string {
  if (!Number.isFinite(amount)) return "—";
  const c = code ?? getCurrencyCode();
  return formatterFor(c).format(Math.round(amount));
}

/** @deprecated Use {@link formatMoney} */
export function formatNgn(amount: number): string {
  return formatMoney(amount);
}

/** Parse integer amount from formatted or partial input (ignores symbols, commas, spaces). */
export function parseMoneyInput(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  const n = Number(digits);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.round(n), Number.MAX_SAFE_INTEGER);
}

/** @deprecated Use {@link parseMoneyInput} */
export function parseNgnInput(raw: string): number {
  return parseMoneyInput(raw);
}

export function getCurrencySymbol(code?: CurrencyCode): string {
  return currencyOption(code ?? getCurrencyCode()).symbol;
}

/** Example placeholder for money inputs, e.g. "₦35,000" */
export function sampleMoneyPlaceholder(example = 35000): string {
  return formatMoney(example);
}
