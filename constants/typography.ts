import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

/**
 * Typography roles:
 * - Instrument Sans → normal UI text
 * - Fraunces → currency symbols
 * - JetBrains Mono → income / bills / outflow amounts
 */
export const typeface = {
  regular: 'InstrumentSans_400Regular',
  medium: 'InstrumentSans_500Medium',
  semibold: 'InstrumentSans_600SemiBold',
  bold: 'InstrumentSans_700Bold',
  extraBold: 'InstrumentSans_700Bold',
  display: 'Fraunces_700Bold',
  displayRegular: 'Fraunces_400Regular',
  displayMedium: 'Fraunces_500Medium',
  currency: 'Fraunces_600SemiBold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
  monoRegular: 'JetBrainsMono_400Regular',
} as const;

/** React Navigation theme typeface slots — headers, tab titles when using theme fonts. */
export const navigationFonts = {
  regular: { fontFamily: typeface.regular, fontWeight: '400' as const },
  medium: { fontFamily: typeface.medium, fontWeight: '500' as const },
  bold: { fontFamily: typeface.semibold, fontWeight: '600' as const },
  heavy: { fontFamily: typeface.bold, fontWeight: '700' as const },
};

function instrumentFamilyForWeight(weight: TextStyle['fontWeight'] | undefined): string {
  if (weight === undefined || weight === 'normal' || weight === 400 || weight === '400') {
    return typeface.regular;
  }
  if (weight === '500' || weight === 500) return typeface.medium;
  if (weight === '600' || weight === 600) return typeface.semibold;
  if (weight === '700' || weight === 'bold' || weight === 700) return typeface.bold;
  if (weight === '800' || weight === '900' || weight === 800 || weight === 900) {
    return typeface.bold;
  }
  if (typeof weight === 'number') {
    if (weight >= 700) return typeface.bold;
    if (weight >= 600) return typeface.semibold;
    if (weight >= 500) return typeface.medium;
  }
  return typeface.regular;
}

/**
 * Applies Instrument Sans when no explicit fontFamily is set.
 * Maps fontWeight → the matching face so Android matches iOS.
 */
export function mergeInterTextStyle(style?: StyleProp<TextStyle>): TextStyle {
  return mergeBodyTextStyle(style);
}

export function mergeBodyTextStyle(style?: StyleProp<TextStyle>): TextStyle {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  if (!flat || Object.keys(flat).length === 0) {
    return { fontFamily: typeface.regular };
  }
  if (flat.fontFamily != null && flat.fontFamily !== '') {
    return flat;
  }
  const { fontWeight, ...rest } = flat;
  return {
    ...rest,
    fontFamily: instrumentFamilyForWeight(fontWeight),
  };
}
