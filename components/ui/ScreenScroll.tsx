import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';

import { View } from '@/components/Themed';
import { spacing } from '@/constants/theme';

import { useFluxPalette } from '@/components/ui/useFluxPalette';

type Props = {
  children: ReactNode;
} & Omit<ScrollViewProps, 'children' | 'style' | 'contentContainerStyle'>;

export function ScreenScroll({ children, ...scrollProps }: Props) {
  const { palette } = useFluxPalette();

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...scrollProps}>
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  inner: {
    padding: spacing.lg,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
});
