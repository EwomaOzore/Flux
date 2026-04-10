import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
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
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(48, tabBarHeight + spacing.md) },
      ]}
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
  },
  inner: {
    padding: spacing.lg,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
});
