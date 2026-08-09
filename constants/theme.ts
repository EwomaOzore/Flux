import { Platform, StyleSheet, type ViewStyle } from 'react-native';

import type { ThemeName } from '@/constants/Colors';

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  full: 9999,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
} as const;

/** Soft elevation for cards (works on iOS + Android). */
export function cardElevation(colorScheme: ThemeName | null | undefined): ViewStyle {
  const dark = colorScheme === 'dark';
  if (Platform.OS === 'android') {
    return { elevation: dark ? 4 : 3 };
  }
  return {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: dark ? 8 : 4 },
    shadowOpacity: dark ? 0.35 : 0.08,
    shadowRadius: dark ? 18 : 12,
  };
}

export function hairlineBorder(color: string): ViewStyle {
  return {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color,
  };
}
