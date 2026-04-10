import { useMemo } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

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
      borderColor: palette.borderStrong,
      color: palette.text,
      backgroundColor: palette.surfaceMuted,
    }),
    [palette.borderStrong, palette.text, palette.surfaceMuted]
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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
  },
  money: {
    fontVariant: ['tabular-nums'],
  },
});
