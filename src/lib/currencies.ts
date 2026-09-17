import { getLocales } from "expo-localization";

/** ISO 4217 currency code (e.g. NGN, MXN, KES). */
export type CurrencyCode = string;

export type CurrencyOption = {
  readonly code: CurrencyCode;
  readonly label: string;
  readonly symbol: string;
  /** BCP 47 locale for `Intl.NumberFormat` */
  readonly locale: string;
};

/**
 * Curated picker list — major world currencies.
 * Any other valid ISO code still works when detected from the device locale.
 */
export const CURRENCY_OPTIONS: readonly CurrencyOption[] = [
  { code: "NGN", label: "Nigerian naira", symbol: "₦", locale: "en-NG" },
  { code: "USD", label: "US dollar", symbol: "$", locale: "en-US" },
  { code: "GBP", label: "British pound", symbol: "£", locale: "en-GB" },
  { code: "EUR", label: "Euro", symbol: "€", locale: "en-IE" },
  { code: "CAD", label: "Canadian dollar", symbol: "$", locale: "en-CA" },
  { code: "AUD", label: "Australian dollar", symbol: "$", locale: "en-AU" },
  { code: "NZD", label: "New Zealand dollar", symbol: "$", locale: "en-NZ" },
  { code: "ZAR", label: "South African rand", symbol: "R", locale: "en-ZA" },
  { code: "KES", label: "Kenyan shilling", symbol: "KSh", locale: "en-KE" },
  { code: "GHS", label: "Ghanaian cedi", symbol: "₵", locale: "en-GH" },
  { code: "EGP", label: "Egyptian pound", symbol: "E£", locale: "en-EG" },
  { code: "MAD", label: "Moroccan dirham", symbol: "MAD", locale: "en-MA" },
  { code: "TZS", label: "Tanzanian shilling", symbol: "TSh", locale: "en-TZ" },
  { code: "UGX", label: "Ugandan shilling", symbol: "USh", locale: "en-UG" },
  { code: "RWF", label: "Rwandan franc", symbol: "FRw", locale: "en-RW" },
  {
    code: "XOF",
    label: "West African CFA franc",
    symbol: "CFA",
    locale: "fr-SN",
  },
  {
    code: "XAF",
    label: "Central African CFA franc",
    symbol: "FCFA",
    locale: "fr-CM",
  },
  { code: "MXN", label: "Mexican peso", symbol: "$", locale: "es-MX" },
  { code: "ARS", label: "Argentine peso", symbol: "$", locale: "es-AR" },
  { code: "COP", label: "Colombian peso", symbol: "$", locale: "es-CO" },
  { code: "CLP", label: "Chilean peso", symbol: "$", locale: "es-CL" },
  { code: "PEN", label: "Peruvian sol", symbol: "S/", locale: "es-PE" },
  { code: "BRL", label: "Brazilian real", symbol: "R$", locale: "pt-BR" },
  { code: "PHP", label: "Philippine peso", symbol: "₱", locale: "en-PH" },
  { code: "INR", label: "Indian rupee", symbol: "₹", locale: "en-IN" },
  { code: "PKR", label: "Pakistani rupee", symbol: "₨", locale: "en-PK" },
  { code: "BDT", label: "Bangladeshi taka", symbol: "৳", locale: "en-BD" },
  { code: "LKR", label: "Sri Lankan rupee", symbol: "Rs", locale: "en-LK" },
  { code: "IDR", label: "Indonesian rupiah", symbol: "Rp", locale: "id-ID" },
  { code: "MYR", label: "Malaysian ringgit", symbol: "RM", locale: "en-MY" },
  { code: "SGD", label: "Singapore dollar", symbol: "$", locale: "en-SG" },
  { code: "THB", label: "Thai baht", symbol: "฿", locale: "th-TH" },
  { code: "VND", label: "Vietnamese dong", symbol: "₫", locale: "vi-VN" },
  { code: "CNY", label: "Chinese yuan", symbol: "¥", locale: "zh-CN" },
  { code: "HKD", label: "Hong Kong dollar", symbol: "$", locale: "en-HK" },
  { code: "TWD", label: "New Taiwan dollar", symbol: "NT$", locale: "zh-TW" },
  { code: "JPY", label: "Japanese yen", symbol: "¥", locale: "ja-JP" },
  { code: "KRW", label: "South Korean won", symbol: "₩", locale: "ko-KR" },
  { code: "AED", label: "UAE dirham", symbol: "د.إ", locale: "en-AE" },
  { code: "SAR", label: "Saudi riyal", symbol: "﷼", locale: "en-SA" },
  { code: "QAR", label: "Qatari riyal", symbol: "QR", locale: "en-QA" },
  { code: "TRY", label: "Turkish lira", symbol: "₺", locale: "tr-TR" },
  { code: "ILS", label: "Israeli shekel", symbol: "₪", locale: "he-IL" },
  { code: "CHF", label: "Swiss franc", symbol: "CHF", locale: "de-CH" },
  { code: "SEK", label: "Swedish krona", symbol: "kr", locale: "sv-SE" },
  { code: "NOK", label: "Norwegian krone", symbol: "kr", locale: "nb-NO" },
  { code: "DKK", label: "Danish krone", symbol: "kr", locale: "da-DK" },
  { code: "PLN", label: "Polish złoty", symbol: "zł", locale: "pl-PL" },
  { code: "CZK", label: "Czech koruna", symbol: "Kč", locale: "cs-CZ" },
  { code: "RON", label: "Romanian leu", symbol: "lei", locale: "ro-RO" },
  { code: "HUF", label: "Hungarian forint", symbol: "Ft", locale: "hu-HU" },
  { code: "RUB", label: "Russian ruble", symbol: "₽", locale: "ru-RU" },
  { code: "UAH", label: "Ukrainian hryvnia", symbol: "₴", locale: "uk-UA" },
];

export const DEFAULT_CURRENCY: CurrencyCode = "NGN";

export function isCurrencyCode(value: string): value is CurrencyCode {
  if (!/^[A-Z]{3}$/.test(value)) return false;
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: value }).format(
      0,
    );
    return true;
  } catch {
    return false;
  }
}

function currencyDisplayName(code: CurrencyCode): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function currencySymbolFor(code: CurrencyCode): string {
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

function localeForCurrency(code: CurrencyCode): string {
  const known = CURRENCY_OPTIONS.find((c) => c.code === code);
  if (known) return known.locale;
  try {
    for (const locale of getLocales()) {
      if (locale.currencyCode === code && locale.languageTag) {
        return locale.languageTag;
      }
    }
  } catch {
    /* fall through */
  }
  return "en";
}

/** Resolve display metadata for any ISO currency (curated or device-detected). */
export function currencyOption(code: CurrencyCode): CurrencyOption {
  const known = CURRENCY_OPTIONS.find((c) => c.code === code);
  if (known) return known;
  const safe = isCurrencyCode(code) ? code : DEFAULT_CURRENCY;
  if (safe !== code) {
    return currencyOption(safe);
  }
  return {
    code: safe,
    label: currencyDisplayName(safe),
    symbol: currencySymbolFor(safe),
    locale: localeForCurrency(safe),
  };
}

/**
 * Guess currency from the device locale (language/region settings).
 * Uses no GPS and no network. Accepts any valid ISO 4217 code the OS reports
 * (pesos, shillings, yen, …). Falls back to {@link DEFAULT_CURRENCY}.
 */
export function detectCurrencyFromDevice(): CurrencyCode {
  try {
    for (const locale of getLocales()) {
      const fromCurrency = locale.currencyCode?.toUpperCase();
      if (fromCurrency && isCurrencyCode(fromCurrency)) return fromCurrency;
    }
  } catch {
    /* keep fallback */
  }
  return DEFAULT_CURRENCY;
}

/**
 * Picker order with the preferred code first.
 * If preferred isn't in the curated list (rare locale), inject a synthetic option.
 */
export function currencyOptionsPreferredFirst(
  preferred: CurrencyCode,
): readonly CurrencyOption[] {
  const preferredOpt = currencyOption(preferred);
  const rest = CURRENCY_OPTIONS.filter((c) => c.code !== preferredOpt.code);
  return [preferredOpt, ...rest];
}
