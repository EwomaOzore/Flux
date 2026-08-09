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
  variant?: 'body' | 'titleEmphasis' | 'compact' | 'compactEmphasis';
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
  const compact = variant === 'compact' || variant === 'compactEmphasis';
  const parts = formatMoneyParts(amount, {
    code: currencyCode,
    compact,
    signed: signed || compact,
  } satisfies FormatMoneyPartsOptions);

  const base =
    variant === 'titleEmphasis'
      ? styles.titleEmphasis
      : variant === 'compactEmphasis'
        ? styles.compactEmphasis
        : variant === 'compact'
          ? styles.compact
          : styles.body;

  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const colorStyle: StyleProp<TextStyle> = flat?.color != null ? { color: flat.color } : null;

  return (
    <Text {...rest} style={[base, style]}>
      {parts.sign ? (
        <Text style={[styles.mono, colorStyle]}>{parts.sign}</Text>
      ) : null}
      {parts.symbol ? (
        <Text style={[styles.currency, colorStyle]}>{parts.symbol}</Text>
      ) : null}
      <Text style={[styles.mono, colorStyle]}>{parts.value}</Text>
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
  titleEmphasis: {
    fontSize: 40,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  currency: {
    fontFamily: typeface.currency,
  },
  mono: {
    fontFamily: typeface.monoBold,
  },
});
