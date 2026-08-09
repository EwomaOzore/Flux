import { useMemo } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { typeface } from '@/constants/typography';
import { radii, spacing } from '@/constants/theme';

import { useFluxPalette } from '@/components/ui/useFluxPalette';

type Props = TextInputProps & {
  /** Tabular numerals for currency fields */
  money?: boolean;
};

export function FluxTextInput({ style, money, placeholderTextColor, ...rest }: Props) {
  const { palette } = useFluxPalette();

  const fieldStyle = useMemo(
    () => ({
      fontFamily: typeface.regular,
      borderColor: palette.cardBorder,
      color: palette.inputText,
      backgroundColor: palette.inputBackground,
    }),
    [palette.cardBorder, palette.inputText, palette.inputBackground]
  );

  return (
    <TextInput
      placeholderTextColor={placeholderTextColor ?? palette.textMuted}
      style={[styles.base, fieldStyle, money && styles.money, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
  },
  money: {
    fontFamily: typeface.mono,
    fontVariant: ['tabular-nums'],
  },
});
