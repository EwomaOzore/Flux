import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";
import { useFluxPalette } from "@/components/ui";
import { radii, spacing } from "@/constants/theme";
import { CURRENCY_OPTIONS, type CurrencyCode } from "@/src/lib/currencies";
import { formatMoney } from "@/src/lib/formatCurrency";

type Props = {
  readonly selected: CurrencyCode;
  readonly onSelect: (code: CurrencyCode) => void;
};

export function CurrencyPickerList({ selected, onSelect }: Props) {
  const { palette } = useFluxPalette();

  return (
    <View style={styles.list}>
      {CURRENCY_OPTIONS.map((c, idx) => {
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
                  idx < CURRENCY_OPTIONS.length - 1
                    ? StyleSheet.hairlineWidth
                    : 0,
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
            <Text style={[styles.sample, { color: palette.textSecondary }]}>
              {formatMoney(125000, c.code)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: radii.md,
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
    fontSize: 20,
    fontWeight: "800",
    width: 36,
    textAlign: "center",
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
  code: {
    fontSize: 12,
    marginTop: 2,
  },
  sample: {
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
