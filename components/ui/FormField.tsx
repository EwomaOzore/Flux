import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { spacing } from '@/constants/theme';
import { typeface } from '@/constants/typography';

type Props = {
  label: string;
  children: ReactNode;
};

export function FormField({ label, children }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    marginTop: spacing.md,
  },
  label: {
    fontFamily: typeface.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.75,
  },
});
