import {
  currencyOption,
  type CurrencyCode,
} from "@/src/lib/currencies";
import { getCurrencyCode } from "@/src/state/currencyStore";

const formatterCache = new Map<CurrencyCode, Intl.NumberFormat>();
const numberFormatterCache = new Map<string, Intl.NumberFormat>();

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

function numberFormatterFor(code: CurrencyCode): Intl.NumberFormat {
  const { locale } = currencyOption(code);
  let fmt = numberFormatterCache.get(locale);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
    });
    numberFormatterCache.set(locale, fmt);
  }
  return fmt;
}

export function formatMoney(amount: number, code?: CurrencyCode): string {
  if (!Number.isFinite(amount)) return "—";
  const c = code ?? getCurrencyCode();
  return formatterFor(c).format(Math.round(amount));
}

export type MoneyParts = {
  /** Leading sign for display (`+`, `-`, or empty). */
  sign: "" | "+" | "-";
  /** Currency symbol in Fraunces. */
  symbol: string;
  /** Numeric portion (and compact suffix) in JetBrains Mono. */
  value: string;
};

export type FormatMoneyPartsOptions = {
  code?: CurrencyCode;
  /** Force a leading `+` on positive amounts. */
  signed?: boolean;
  /** Compact form like `445k` / `1.2M`. */
  compact?: boolean;
};

function formatCompactDigits(abs: number): string {
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const rounded =
      abs % 1_000_000 === 0
        ? String(millions)
        : millions.toFixed(1).replace(/\.0$/, "");
    return `${rounded}M`;
  }
  if (abs >= 1000) {
    return `${Math.round(abs / 1000)}k`;
  }
  return String(Math.round(abs));
}

/** Split money into symbol (Fraunces) + numeric value (JetBrains Mono). */
export function formatMoneyParts(
  amount: number,
  options: FormatMoneyPartsOptions = {},
): MoneyParts {
  if (!Number.isFinite(amount)) {
    return { sign: "", symbol: "", value: "—" };
  }
  const code = options.code ?? getCurrencyCode();
  const rounded = Math.round(amount);
  const abs = Math.abs(rounded);
  const symbol = currencyOption(code).symbol;
  const value = options.compact
    ? formatCompactDigits(abs)
    : numberFormatterFor(code).format(abs);

  let sign: MoneyParts["sign"] = "";
  if (rounded < 0) sign = "-";
  else if (options.signed && rounded > 0) sign = "+";

  return { sign, symbol, value };
}

/** Compact money string for plain-text contexts (logs, alerts). */
export function formatMoneyCompact(amount: number, code?: CurrencyCode): string {
  const parts = formatMoneyParts(amount, { code, compact: true, signed: amount !== 0 });
  if (parts.value === "—") return "—";
  return `${parts.sign}${parts.symbol}${parts.value}`;
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
