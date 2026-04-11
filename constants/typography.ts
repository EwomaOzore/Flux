import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

/** Inter (loaded in app/_layout). Use these names with fontFamily — same files on iOS & Android. */
export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
  mono: 'SpaceMono',
} as const;

/** React Navigation theme font slots — headers, tab titles when using theme fonts. */
export const navigationFonts = {
  regular: { fontFamily: font.regular, fontWeight: '400' as const },
  medium: { fontFamily: font.medium, fontWeight: '500' as const },
  bold: { fontFamily: font.semibold, fontWeight: '600' as const },
  heavy: { fontFamily: font.bold, fontWeight: '700' as const },
};

function interFamilyForWeight(weight: TextStyle['fontWeight'] | undefined): string {
  if (weight === undefined || weight === 'normal' || weight === 400 || weight === '400') {
    return font.regular;
  }
  if (weight === '500' || weight === 500) return font.medium;
  if (weight === '600' || weight === 600) return font.semibold;
  if (weight === '700' || weight === 'bold') return font.bold;
  if (weight === '800' || weight === '900' || weight === 800 || weight === 900) {
    return font.extraBold;
  }
  if (typeof weight === 'number') {
    if (weight >= 800) return font.extraBold;
    if (weight >= 700) return font.bold;
    if (weight >= 600) return font.semibold;
    if (weight >= 500) return font.medium;
  }
  return font.regular;
}

/**
 * Applies Inter when no explicit fontFamily is set; otherwise preserves custom fonts (e.g. SpaceMono).
 * Maps fontWeight → the matching Inter face so Android matches iOS.
 */
export function mergeInterTextStyle(style?: StyleProp<TextStyle>): TextStyle {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  if (!flat || Object.keys(flat).length === 0) {
    return { fontFamily: font.regular };
  }
  if (flat.fontFamily != null && flat.fontFamily !== '') {
    return flat;
  }
  const { fontWeight, ...rest } = flat;
  return {
    ...rest,
    fontFamily: interFamilyForWeight(fontWeight),
  };
}
