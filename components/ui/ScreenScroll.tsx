import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
} from 'react-native';

import { View } from '@/components/Themed';
import { spacing } from '@/constants/theme';

import { useFluxPalette } from '@/components/ui/useFluxPalette';

type Props = {
  children: ReactNode;
} & Omit<ScrollViewProps, 'children' | 'style' | 'contentContainerStyle'>;

export function ScreenScroll({ children, ...scrollProps }: Props) {
  const { palette } = useFluxPalette();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}>
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.background }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(48, tabBarHeight + spacing.md) },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        {...scrollProps}>
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kav: {
    flex: 1,
  },
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
