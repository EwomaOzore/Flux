import { StyleSheet, Text, type TextProps } from 'react-native';

import { font } from '@/constants/typography';
import { formatNgn } from '@/src/lib/formatCurrency';

type Props = TextProps & {
  amount: number;
  variant?: 'body' | 'titleEmphasis';
};

export function MoneyText({ amount, variant = 'body', style, ...rest }: Props) {
  return (
    <Text {...rest} style={[variant === 'titleEmphasis' ? styles.titleEmphasis : styles.body, style]}>
      {formatNgn(amount)}
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
