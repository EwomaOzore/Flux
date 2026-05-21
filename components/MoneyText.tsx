import { StyleSheet, Text, type TextProps } from 'react-native';

import { font } from '@/constants/typography';
import { formatMoney } from '@/src/lib/formatCurrency';
import { useCurrencyStore } from '@/src/state/currencyStore';

type Props = TextProps & {
  amount: number;
  variant?: 'body' | 'titleEmphasis';
};

export function MoneyText({ amount, variant = 'body', style, ...rest }: Props) {
  const currencyCode = useCurrencyStore((s) => s.currencyCode);
  return (
    <Text {...rest} style={[variant === 'titleEmphasis' ? styles.titleEmphasis : styles.body, style]}>
      {formatMoney(amount, currencyCode)}
    </Text>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: font.regular,
    fontVariant: ['tabular-nums'],
  },
  titleEmphasis: {
    fontFamily: font.extraBold,
    fontSize: 34,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
});
