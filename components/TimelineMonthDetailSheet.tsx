import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FluxBottomSheet,
  FluxBottomSheetHeader,
} from "@/components/FluxBottomSheet";
import { MoneyText } from "@/components/MoneyText";
import { Text } from "@/components/Themed";
import { useFluxPalette } from "@/components/ui/useFluxPalette";
import { spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import {
  formatMonthIdDisplay,
  formatMonthIdShort,
  monthsInclusiveCount,
} from "@/src/domain/month";
import type { BillItem, MonthRollup, PaydayLine } from "@/src/domain/types";

type Props = {
  readonly rollup: MonthRollup | null;
  readonly bills: BillItem[];
  readonly onClose: () => void;
};

function outflowSub(line: PaydayLine): string | undefined {
  if (line.recurrence !== "monthly") return undefined;
  const start = line.startMonth ?? line.month;
  const end = line.endMonth ?? start;
  const count = monthsInclusiveCount(start, end);
  return `Monthly · ${count} mo · ${formatMonthIdShort(start)}–${formatMonthIdShort(end)}`;
}

export function TimelineMonthDetailSheet({ rollup, bills, onClose }: Props) {
  const { palette, colorScheme } = useFluxPalette();
  const insets = useSafeAreaInsets();
  const dark = colorScheme === "dark";
  const border = dark ? palette.cardBorder : "#E0DAD3";
  const visible = rollup != null;
  const positive = (rollup?.cushionAfterBills ?? 0) >= 0;
  const accent = positive ? palette.success : palette.danger;
  const activeBills = bills.filter((b) => b.amount > 0);

  return (
    <FluxBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={["72%", "92%"]}
    >
      {rollup ? (
        <View style={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}>
          <FluxBottomSheetHeader
            title={formatMonthIdDisplay(rollup.month)}
            onClose={onClose}
            subtitle="Payday breakdown for this month"
          />

          <View style={styles.body}>
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: border,
                },
              ]}
            >
              <SummaryRow
                label="Income"
                amount={rollup.income}
                textColor={palette.text}
                muted={palette.textMuted}
              />
              <View style={[styles.rule, { backgroundColor: border }]} />
              <SummaryRow
                label="Bills"
                amount={-rollup.billsTotal}
                signed
                textColor={palette.text}
                muted={palette.textMuted}
              />
              <View style={[styles.rule, { backgroundColor: border }]} />
              <SummaryRow
                label="Payday outflows"
                amount={-rollup.totalPaydayOutflow}
                signed
                textColor={palette.text}
                muted={palette.textMuted}
              />
              <View style={[styles.rule, { backgroundColor: border }]} />
              <SummaryRow
                label={positive ? "Cushion" : "Deficit"}
                amount={rollup.cushionAfterBills}
                emphasis
                valueColor={accent}
                textColor={palette.text}
                muted={palette.textMuted}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>
              PAYDAY OUTFLOWS
            </Text>
            <View
              style={[
                styles.listCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: border,
                },
              ]}
            >
              {rollup.lines.length === 0 ? (
                <Text style={[styles.empty, { color: palette.textMuted }]}>
                  No payday outflows this month.
                </Text>
              ) : (
                rollup.lines.map((line, idx) => {
                  const sub = outflowSub(line);
                  return (
                    <View
                      key={line.id}
                      style={[
                        styles.itemRow,
                        idx < rollup.lines.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: palette.accentOutflow },
                        ]}
                      />
                      <View style={styles.itemText}>
                        <Text
                          style={[styles.itemLabel, { color: palette.text }]}
                          numberOfLines={2}
                        >
                          {line.label.trim() || "Outflow"}
                        </Text>
                        {sub ? (
                          <Text
                            style={[
                              styles.itemSub,
                              { color: palette.textMuted },
                            ]}
                            numberOfLines={1}
                          >
                            {sub}
                          </Text>
                        ) : null}
                      </View>
                      <MoneyText
                        amount={-line.amount}
                        signed
                        style={{
                          color: palette.textSecondary,
                          fontSize: 14,
                        }}
                      />
                    </View>
                  );
                })
              )}
            </View>

            {activeBills.length > 0 ? (
              <>
                <Text
                  style={[styles.sectionTitle, { color: palette.textMuted }]}
                >
                  BILLS
                </Text>
                <View
                  style={[
                    styles.listCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: border,
                    },
                  ]}
                >
                  {activeBills.map((bill, idx) => (
                    <View
                      key={bill.id}
                      style={[
                        styles.itemRow,
                        idx < activeBills.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: palette.accentBills },
                        ]}
                      />
                      <Text
                        style={[styles.itemLabel, { color: palette.text }]}
                        numberOfLines={1}
                      >
                        {bill.label.trim() || "Bill"}
                      </Text>
                      <MoneyText
                        amount={-bill.amount}
                        signed
                        style={{
                          color: palette.textSecondary,
                          fontSize: 14,
                        }}
                      />
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </View>
        </View>
      ) : null}
    </FluxBottomSheet>
  );
}

function SummaryRow({
  label,
  amount,
  signed,
  emphasis,
  valueColor,
  textColor,
  muted,
}: {
  label: string;
  amount: number;
  signed?: boolean;
  emphasis?: boolean;
  valueColor?: string;
  textColor: string;
  muted: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text
        style={[
          styles.summaryLabel,
          { color: emphasis ? textColor : muted },
          emphasis && styles.summaryLabelEm,
        ]}
      >
        {label}
      </Text>
      <MoneyText
        amount={amount}
        signed={signed}
        style={[
          styles.summaryValue,
          { color: valueColor ?? textColor },
          emphasis && styles.summaryValueEm,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 10,
  },
  summaryLabel: {
    flex: 1,
    fontFamily: typeface.regular,
    fontSize: 14,
  },
  summaryLabelEm: {
    fontFamily: typeface.bold,
  },
  summaryValue: {
    fontSize: 14,
  },
  summaryValueEm: {
    fontSize: 16,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontFamily: typeface.bold,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  listCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  empty: {
    fontFamily: typeface.regular,
    fontSize: 14,
    padding: spacing.lg,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  itemLabel: {
    flex: 1,
    fontFamily: typeface.regular,
    fontSize: 14,
  },
  itemSub: {
    fontFamily: typeface.regular,
    fontSize: 12,
  },
});
