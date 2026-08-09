import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  View as RNView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";

import { BrandMark } from "@/components/BrandMark";
import { MoneyText } from "@/components/MoneyText";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { cardElevation, radii, spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import { buildRollupsFromStreams } from "@/src/domain/engine";
import {
  addMonthsId,
  currentPaydayMonthId,
  daysUntilPayday,
  formatMonthIdDisplay,
  formatPaydayDate,
} from "@/src/domain/month";
import { totalBillsAmount } from "@/src/domain/types";
import { useBudgetStore } from "@/src/state/budgetStore";

export default function NextScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const paydayMonth = currentPaydayMonthId();
  const budget = useBudgetStore(
    useShallow((s) => ({
      incomeStreams: s.incomeStreams,
      billItems: s.billItems,
      lines: s.lines,
    })),
  );

  const upcoming = useMemo(() => {
    const months = [
      paydayMonth,
      addMonthsId(paydayMonth, 1),
      addMonthsId(paydayMonth, 2),
    ];
    return buildRollupsFromStreams(
      months,
      budget.incomeStreams,
      totalBillsAmount(budget.billItems),
      budget.lines,
    );
  }, [budget, paydayMonth]);

  const billsThisMonth = budget.billItems.filter((b) => b.amount > 0);

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: Math.max(spacing.xl + 40, tabBarHeight + spacing.md),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <RNView style={styles.titleRow}>
        <BrandMark size={28} />
        <RNView style={styles.titleCol}>
          <Text style={[styles.title, { color: palette.text }]}>Upcoming</Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>
            Next 3 payday runs
          </Text>
        </RNView>
      </RNView>

      {upcoming.map((monthRoll, index) => {
        const featured = index === 0;
        const days = daysUntilPayday(monthRoll.month);
        const positive = monthRoll.cushionAfterBills >= 0;
        const monthTitle = formatMonthIdDisplay(monthRoll.month).replace(
          ",",
          "",
        );

        return (
          <RNView
            key={monthRoll.month}
            style={[
              styles.monthCard,
              featured
                ? { backgroundColor: palette.tint }
                : {
                    backgroundColor: palette.surface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: palette.border,
                  },
              !featured && cardElevation(colorScheme),
            ]}
          >
            <RNView style={styles.monthTop}>
              <RNView style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.nextLabel,
                    { color: featured ? "rgba(255,255,255,0.75)" : palette.textMuted },
                  ]}
                >
                  {featured ? `NEXT · ${days} DAYS` : `${days} DAYS`}
                </Text>
                <Text
                  style={[
                    styles.monthName,
                    { color: featured ? "#fff" : palette.text },
                  ]}
                >
                  {monthTitle}
                </Text>
                <Text
                  style={[
                    styles.paydayLine,
                    {
                      color: featured
                        ? "rgba(255,255,255,0.8)"
                        : palette.textMuted,
                    },
                  ]}
                >
                  Payday: {formatPaydayDate(monthRoll.month)}
                </Text>
              </RNView>
              <RNView
                style={[
                  styles.cushionBadge,
                  {
                    backgroundColor: featured
                      ? "rgba(255,255,255,0.16)"
                      : palette.successMuted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cushionBadgeLabel,
                    {
                      color: featured
                        ? "rgba(255,255,255,0.75)"
                        : palette.success,
                    },
                  ]}
                >
                  CUSHION
                </Text>
                <MoneyText
                  amount={monthRoll.cushionAfterBills}
                  variant="compact"
                  signed
                  style={{
                    color: featured
                      ? "#fff"
                      : positive
                        ? palette.success
                        : palette.danger,
                    fontSize: 16,
                  }}
                />
              </RNView>
            </RNView>

            <RNView
              style={[
                styles.monthDivider,
                {
                  backgroundColor: featured
                    ? "rgba(255,255,255,0.2)"
                    : palette.border,
                },
              ]}
            />

            <RNView style={styles.statCols}>
              {(
                [
                  ["INCOME", monthRoll.income],
                  ["BILLS", monthRoll.billsTotal],
                  ["OUTFLOWS", monthRoll.totalPaydayOutflow],
                ] as const
              ).map(([label, amount]) => (
                <RNView key={label} style={styles.statCol}>
                  <Text
                    style={[
                      styles.statColLabel,
                      {
                        color: featured
                          ? "rgba(255,255,255,0.7)"
                          : palette.textMuted,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                  <MoneyText
                    amount={amount}
                    variant="compact"
                    style={{
                      color: featured ? "#fff" : palette.text,
                      fontSize: 15,
                    }}
                  />
                </RNView>
              ))}
            </RNView>
          </RNView>
        );
      })}

      <RNView style={styles.sectionDivider}>
        <RNView
          style={[styles.dividerLine, { backgroundColor: palette.border }]}
        />
        <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>
          BILLS DUE THIS MONTH
        </Text>
        <RNView
          style={[styles.dividerLine, { backgroundColor: palette.border }]}
        />
      </RNView>

      <RNView
        style={[
          styles.billsCard,
          { backgroundColor: palette.surface },
          cardElevation(colorScheme),
        ]}
      >
        {billsThisMonth.length === 0 ? (
          <Text style={[styles.empty, { color: palette.textMuted }]}>
            No recurring bills yet. Add them in Plan.
          </Text>
        ) : (
          billsThisMonth.map((bill, i) => (
            <RNView
              key={bill.id}
              style={[
                styles.billRow,
                i < billsThisMonth.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: palette.border,
                },
              ]}
            >
              <RNView
                style={[
                  styles.dayBadge,
                  { backgroundColor: palette.surfaceMuted },
                ]}
              >
                <FontAwesome
                  name="calendar-o"
                  size={12}
                  color={palette.accentBills}
                />
              </RNView>
              <Text style={[styles.billLabel, { color: palette.text }]}>
                {bill.label.trim() || "Bill"}
              </Text>
              <MoneyText
                amount={bill.amount}
                style={{ color: palette.accentBills }}
              />
            </RNView>
          ))
        )}
      </RNView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontFamily: typeface.display,
    fontSize: 32,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  monthCard: {
    borderRadius: radii.xxl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  monthTop: {
    flexDirection: "row",
    gap: spacing.md,
  },
  nextLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  monthName: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  paydayLine: {
    fontSize: 13,
    marginTop: 4,
  },
  cushionBadge: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: "flex-end",
    minWidth: 88,
  },
  cushionBadgeLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  monthDivider: {
    height: StyleSheet.hairlineWidth,
  },
  statCols: {
    flexDirection: "row",
  },
  statCol: {
    flex: 1,
    gap: 4,
  },
  statColLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.7,
  },
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
  billsCard: {
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  empty: {
    padding: spacing.lg,
    fontSize: 14,
  },
  billRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dayBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  billLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
});
