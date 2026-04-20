import { useMemo } from "react";
import { ScrollView, StyleSheet, View as RNView } from "react-native";
import { useShallow } from "zustand/react/shallow";

import { MoneyText } from "@/components/MoneyText";
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { cardElevation, hairlineBorder, radii, spacing } from "@/constants/theme";
import {
  addMonthsId,
  currentPaydayMonthId,
  formatMonthIdDisplay,
} from "@/src/domain/month";
import { buildRollupsFromStreams } from "@/src/domain/engine";
import { totalBillsAmount } from "@/src/domain/types";
import { useBudgetStore } from "@/src/state/budgetStore";

export default function UpcomingScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const paydayMonth = currentPaydayMonthId();
  const budget = useBudgetStore(
    useShallow((s) => ({
      incomeStreams: s.incomeStreams,
      billItems: s.billItems,
      lines: s.lines,
    })),
  );

  const upcoming = useMemo(() => {
    const months = [paydayMonth, addMonthsId(paydayMonth, 1), addMonthsId(paydayMonth, 2)];
    return buildRollupsFromStreams(
      months,
      budget.incomeStreams,
      totalBillsAmount(budget.billItems),
      budget.lines,
    );
  }, [budget, paydayMonth]);

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}>
      <View
        style={[
          styles.intro,
          {
            backgroundColor: palette.infoMuted,
            borderColor: palette.border,
          },
          hairlineBorder(palette.border),
        ]}>
        <Text style={[styles.title, { color: palette.info }]}>Upcoming view</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          Next three payday runs, so you can spot heavy months early.
        </Text>
      </View>

      {upcoming.map((monthRoll) => (
        <RNView
          key={monthRoll.month}
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
            cardElevation(colorScheme),
          ]}>
          <Text style={[styles.month, { color: palette.text }]}>
            {formatMonthIdDisplay(monthRoll.month)}
          </Text>
          <RNView style={styles.meta}>
            <Text style={[styles.metaLabel, { color: palette.textMuted }]}>Income</Text>
            <MoneyText amount={monthRoll.income} style={{ color: palette.textSecondary }} />
          </RNView>
          <RNView style={styles.meta}>
            <Text style={[styles.metaLabel, { color: palette.textMuted }]}>Bills + outflows</Text>
            <MoneyText
              amount={monthRoll.billsTotal + monthRoll.totalPaydayOutflow}
              style={{ color: palette.textSecondary }}
            />
          </RNView>
          <RNView style={styles.meta}>
            <Text style={[styles.metaLabel, { color: palette.textMuted }]}>Cushion</Text>
            <MoneyText
              amount={monthRoll.cushionAfterBills}
              style={{
                color: monthRoll.cushionAfterBills >= 0 ? palette.success : palette.danger,
                fontWeight: "800",
              }}
            />
          </RNView>
          {monthRoll.lines.length > 0 ? (
            <RNView style={styles.linesWrap}>
              {monthRoll.lines.slice(0, 4).map((line) => (
                <RNView key={line.id} style={styles.lineRow}>
                  <Text style={[styles.lineLabel, { color: palette.text }]}>{line.label}</Text>
                  <MoneyText amount={line.amount} style={{ color: palette.textSecondary }} />
                </RNView>
              ))}
              {monthRoll.lines.length > 4 ? (
                <Text style={[styles.more, { color: palette.textMuted }]}>
                  +{monthRoll.lines.length - 4} more line items
                </Text>
              ) : null}
            </RNView>
          ) : null}
        </RNView>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.md,
    gap: spacing.md,
  },
  intro: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  title: {
    fontWeight: "800",
    fontSize: 16,
  },
  body: {
    marginTop: spacing.xs,
    lineHeight: 19,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.xs,
  },
  month: {
    fontWeight: "800",
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontWeight: "700",
  },
  linesWrap: {
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  lineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  lineLabel: {
    flex: 1,
    fontWeight: "600",
  },
  more: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
});
