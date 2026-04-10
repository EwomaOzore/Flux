import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { spacing } from '@/constants/theme';

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
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    opacity: 0.75,
  },
});
