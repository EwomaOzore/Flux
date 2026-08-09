import { StyleSheet, Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { typeface } from '@/constants/typography';
import type { CurrencyCode } from '@/src/lib/currencies';
import {
  formatMoneyParts,
  type FormatMoneyPartsOptions,
} from '@/src/lib/formatCurrency';
import { useCurrencyStore } from '@/src/state/currencyStore';

type Props = Omit<TextProps, 'children'> & {
  amount: number;
  variant?: 'body' | 'titleEmphasis' | 'hero' | 'compact' | 'compactEmphasis' | 'stat';
  /** Force a leading `+` on positive amounts. */
  signed?: boolean;
  /** Override store currency (e.g. currency picker samples). */
  currencyCode?: CurrencyCode;
};

export function MoneyText({
  amount,
  variant = 'body',
  signed = false,
  currencyCode: currencyCodeProp,
  style,
  ...rest
}: Props) {
  const storeCode = useCurrencyStore((s) => s.currencyCode);
  const currencyCode = currencyCodeProp ?? storeCode;
  const compact =
    variant === 'compact' ||
    variant === 'compactEmphasis' ||
    variant === 'stat';
  const hero = variant === 'hero';
  const parts = formatMoneyParts(amount, {
    code: currencyCode,
    compact,
    signed: signed || (compact && variant !== 'stat'),
  } satisfies FormatMoneyPartsOptions);

  const base =
    variant === 'hero'
      ? styles.hero
      : variant === 'titleEmphasis'
        ? styles.titleEmphasis
        : variant === 'stat'
          ? styles.stat
          : variant === 'compactEmphasis'
            ? styles.compactEmphasis
            : variant === 'compact'
              ? styles.compact
              : styles.body;

  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const colorStyle: StyleProp<TextStyle> = flat?.color != null ? { color: flat.color } : null;
  const amountFace = hero
    ? styles.displayRegular
    : variant === 'stat' || variant === 'compact' || variant === 'body'
      ? styles.monoMedium
      : styles.monoBold;
  const symbolFace =
    hero
      ? styles.displayRegular
      : variant === 'stat'
        ? styles.monoMedium
        : styles.currency;

  return (
    <Text {...rest} style={[base, style]}>
      {parts.sign ? (
        <Text style={[amountFace, colorStyle]}>{parts.sign}</Text>
      ) : null}
      {parts.symbol ? (
        <Text style={[symbolFace, colorStyle]}>{parts.symbol}</Text>
      ) : null}
      <Text style={[amountFace, colorStyle]}>{parts.value}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  body: {
    fontVariant: ['tabular-nums'],
  },
  compact: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  compactEmphasis: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  stat: {
    fontSize: 14,
    lineHeight: 21,
    fontVariant: ['tabular-nums'],
  },
  titleEmphasis: {
    fontSize: 40,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  hero: {
    fontSize: 50,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  currency: {
    fontFamily: typeface.currency,
  },
  displayRegular: {
    fontFamily: typeface.displayRegular,
  },
  monoMedium: {
    fontFamily: typeface.mono,
  },
  monoBold: {
    fontFamily: typeface.monoBold,
  },
});
