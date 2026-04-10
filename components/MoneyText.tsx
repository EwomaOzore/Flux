import { StyleSheet, Text, type TextProps } from 'react-native';

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
    fontVariant: ['tabular-nums'],
  },
  titleEmphasis: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
});
