import { Platform, StyleSheet, type ViewStyle } from 'react-native';

import type { ThemeName } from '@/constants/Colors';

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
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
    return { elevation: dark ? 5 : 4 };
  }
  return {
    shadowColor: dark ? '#020617' : '#0f172a',
    shadowOffset: { width: 0, height: dark ? 10 : 6 },
    shadowOpacity: dark ? 0.45 : 0.09,
    shadowRadius: dark ? 20 : 14,
  };
}

export function hairlineBorder(color: string): ViewStyle {
  return {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color,
  };
}
