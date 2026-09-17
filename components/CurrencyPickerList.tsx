import { Pressable, StyleSheet, View } from "react-native";

import { MoneyText } from "@/components/MoneyText";
import { Text } from "@/components/Themed";
import { useFluxPalette } from "@/components/ui";
import { radii, spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import {
  CURRENCY_OPTIONS,
  type CurrencyCode,
  type CurrencyOption,
} from "@/src/lib/currencies";

type Props = {
  readonly selected: CurrencyCode;
  readonly onSelect: (code: CurrencyCode) => void;
  /** `sheet` = compact list (settings). `cards` = onboarding pill rows. */
  readonly variant?: "sheet" | "cards";
  /** Optional ordered list; defaults to {@link CURRENCY_OPTIONS}. */
  readonly options?: readonly CurrencyOption[];
};

export function CurrencyPickerList({
  selected,
  onSelect,
  variant = "sheet",
  options = CURRENCY_OPTIONS,
}: Props) {
  const { palette, colorScheme } = useFluxPalette();
  const dark = colorScheme === "dark";
  const accent = dark ? "#48B872" : "#2B7A50";
  const cardBorder = dark ? palette.cardBorder : "#E0DAD3";
  const cardBg = dark ? palette.inputBackground : "#FFFFFF";

  if (variant === "cards") {
    return (
      <View style={styles.cardList}>
        {options.map((c) => {
          const active = c.code === selected;
          return (
            <Pressable
              key={c.code}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${c.label}, ${c.code}`}
              onPress={() => onSelect(c.code)}
              style={({ pressed }) => [
                styles.cardRow,
                {
                  backgroundColor: active ? accent : cardBg,
                  borderColor: active ? accent : cardBorder,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardLabel,
                  { color: active ? "#FFFFFF" : palette.text },
                ]}
              >
                {c.code} — {titleCase(c.label)}
              </Text>
              <Text
                style={[
                  styles.cardSymbol,
                  {
                    color: active ? "#FFFFFF" : palette.textMuted,
                  },
                ]}
              >
                {c.symbol}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {options.map((c, idx) => {
        const active = c.code === selected;
        return (
          <Pressable
            key={c.code}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${c.label}, ${c.code}`}
            onPress={() => onSelect(c.code)}
            style={({ pressed }) => [
              styles.row,
              {
                borderBottomColor: palette.border,
                borderBottomWidth:
                  idx < options.length - 1 ? StyleSheet.hairlineWidth : 0,
                backgroundColor: active ? palette.tintMuted : "transparent",
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <View style={styles.rowMain}>
              <Text style={[styles.symbol, { color: palette.tintStrong }]}>
                {c.symbol}
              </Text>
              <View style={styles.textCol}>
                <Text style={[styles.label, { color: palette.text }]}>
                  {c.label}
                </Text>
                <Text style={[styles.code, { color: palette.textMuted }]}>
                  {c.code}
                </Text>
              </View>
            </View>
            <MoneyText
              amount={125000}
              currencyCode={c.code}
              style={[styles.sample, { color: palette.textSecondary }]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

const styles = StyleSheet.create({
  list: {
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
    gap: spacing.sm,
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  symbol: {
    fontFamily: typeface.currency,
    fontSize: 20,
    width: 36,
    textAlign: "center",
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontFamily: typeface.regular,
    fontSize: 16,
  },
  code: {
    fontFamily: typeface.regular,
    fontSize: 12,
    marginTop: 2,
  },
  sample: {
    fontSize: 13,
  },
  cardList: {
    gap: spacing.sm,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    minHeight: 56,
  },
  cardLabel: {
    flex: 1,
    fontFamily: typeface.medium,
    fontSize: 16,
  },
  cardSymbol: {
    fontFamily: typeface.currency,
    fontSize: 18,
    marginLeft: spacing.sm,
  },
});
