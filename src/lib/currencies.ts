export type CurrencyCode =
  | "NGN"
  | "USD"
  | "GBP"
  | "EUR"
  | "CAD"
  | "AUD"
  | "ZAR"
  | "KES"
  | "GHS"
  | "INR"
  | "AED";

export type CurrencyOption = {
  readonly code: CurrencyCode;
  readonly label: string;
  readonly symbol: string;
  /** BCP 47 locale for `Intl.NumberFormat` */
  readonly locale: string;
};

export const CURRENCY_OPTIONS: readonly CurrencyOption[] = [
  { code: "NGN", label: "Nigerian naira", symbol: "₦", locale: "en-NG" },
  { code: "USD", label: "US dollar", symbol: "$", locale: "en-US" },
  { code: "GBP", label: "British pound", symbol: "£", locale: "en-GB" },
  { code: "EUR", label: "Euro", symbol: "€", locale: "en-IE" },
  { code: "CAD", label: "Canadian dollar", symbol: "$", locale: "en-CA" },
  // { code: "AUD", label: "Australian dollar", symbol: "$", locale: "en-AU" },
  { code: "ZAR", label: "South African rand", symbol: "R", locale: "en-ZA" },
  { code: "KES", label: "Kenyan shilling", symbol: "KSh", locale: "en-KE" },
  { code: "GHS", label: "Ghanaian cedi", symbol: "₵", locale: "en-GH" },
  // { code: "INR", label: "Indian rupee", symbol: "₹", locale: "en-IN" },
  // { code: "AED", label: "UAE dirham", symbol: "د.إ", locale: "en-AE" },
] as const;

export const DEFAULT_CURRENCY: CurrencyCode = "NGN";

export function currencyOption(code: CurrencyCode): CurrencyOption {
  return CURRENCY_OPTIONS.find((c) => c.code === code) ?? CURRENCY_OPTIONS[0];
}

export function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCY_OPTIONS.some((c) => c.code === value);
}
