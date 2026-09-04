import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useMemo } from "react";
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextStyle,
} from "react-native";

import { useFluxPalette } from "@/components/ui/useFluxPalette";
import { radii, spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";

type Props = TextInputProps & {
  /** Tabular numerals for currency fields */
  money?: boolean;
  /**
   * Use inside `@gorhom/bottom-sheet` so the sheet moves with the keyboard.
   * Required for form sheets — regular TextInput does not notify the sheet.
   */
  sheet?: boolean;
};

export function FluxTextInput({
  style,
  money,
  sheet,
  placeholderTextColor,
  ...rest
}: Props) {
  const { palette } = useFluxPalette();

  const fieldStyle = useMemo(
    (): TextStyle => ({
      fontFamily: typeface.regular,
      borderColor: palette.cardBorder,
      color: palette.inputText,
      backgroundColor: palette.inputBackground,
    }),
    [palette.cardBorder, palette.inputText, palette.inputBackground],
  );

  const inputStyle = [styles.base, fieldStyle, money && styles.money, style];
  const placeholder = placeholderTextColor ?? palette.textMuted;

  if (sheet) {
    return (
      <BottomSheetTextInput
        placeholderTextColor={placeholder}
        style={inputStyle}
        {...rest}
      />
    );
  }

  return (
    <TextInput
      placeholderTextColor={placeholder}
      style={inputStyle}
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
    fontVariant: ["tabular-nums"],
  },
});
