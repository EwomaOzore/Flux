import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { cardElevation } from '@/constants/theme';
import { radii, spacing } from '@/constants/theme';

import { useFluxPalette } from '@/components/ui/useFluxPalette';

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function SectionCard({ title, subtitle, children }: Props) {
  const { palette, colorScheme } = useFluxPalette();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
        cardElevation(colorScheme),
      ]}>
      <View style={styles.head}>
        <View style={[styles.iconWrap, { backgroundColor: palette.tintMuted }]}>
          <View style={[styles.iconDot, { backgroundColor: palette.tint }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.sub, { color: palette.textMuted }]}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: 4,
  },
});
