import { MoneyText } from "@/components/MoneyText";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { spacing } from "@/constants/theme";
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
import { useBottomTabBarHeight } from "expo-router/tabs";
import { useMemo } from "react";
import { Image, View as RNView, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";

const CARD_BORDER_LIGHT = "#E0DAD3";
const brandLogo = require("../../assets/images/icon.png");

export default function NextScreen() {
  const colorScheme = useColorScheme();
  const dark = colorScheme === "dark";
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

  const featuredGreen = dark ? "#48B872" : "#2B7A50";
  const cardBorder = dark ? palette.cardBorder : CARD_BORDER_LIGHT;
  const secondaryCardBg = dark ? palette.inputBackground : "#FFFFFF";
  const billsCardBg = secondaryCardBg;

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
        <Image source={brandLogo} style={styles.brandLogo} />
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
        const mutedOnCard = featured
          ? "rgba(255,255,255,0.72)"
          : palette.textMuted;
        const strongOnCard = featured ? "#FFFFFF" : palette.text;
        const dividerColor = featured ? "rgba(255,255,255,0.22)" : cardBorder;

        return (
          <RNView
            key={monthRoll.month}
            style={[
              styles.monthCard,
              featured
                ? { backgroundColor: featuredGreen }
                : {
                    backgroundColor: secondaryCardBg,
                    borderWidth: 1,
                    borderColor: cardBorder,
                  },
            ]}
          >
            <RNView style={styles.monthTop}>
              <RNView style={styles.monthMeta}>
                <Text style={[styles.nextLabel, { color: mutedOnCard }]}>
                  {featured ? `NEXT • ${days} DAYS` : `${days} DAYS`}
                </Text>
                <Text style={[styles.monthName, { color: strongOnCard }]}>
                  {monthTitle}
                </Text>
                <Text style={[styles.paydayLine, { color: mutedOnCard }]}>
                  Payday: {formatPaydayDate(monthRoll.month)}
                </Text>
              </RNView>
              <RNView
                style={[
                  styles.cushionBadge,
                  {
                    backgroundColor: featured
                      ? "rgba(0,0,0,0.18)"
                      : dark
                        ? "rgba(72,184,114,0.16)"
                        : palette.successMuted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cushionBadgeLabel,
                    {
                      color: featured ? "rgba(255,255,255,0.7)" : featuredGreen,
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
                      ? "#FFFFFF"
                      : positive
                        ? featuredGreen
                        : palette.danger,
                    fontSize: 16,
                  }}
                />
              </RNView>
            </RNView>

            <RNView
              style={[styles.monthDivider, { backgroundColor: dividerColor }]}
            />

            <RNView style={styles.statCols}>
              {(
                [
                  ["INCOME", monthRoll.income],
                  ["BILLS", monthRoll.billsTotal],
                  ["OUTFLOWS", monthRoll.totalPaydayOutflow],
                ] as const
              ).map(([label, amount], i) => (
                <RNView
                  key={label}
                  style={[
                    styles.statCol,
                    i > 0 && {
                      borderLeftWidth: 1,
                      borderLeftColor: dividerColor,
                      paddingLeft: spacing.md,
                    },
                  ]}
                >
                  <Text style={[styles.statColLabel, { color: mutedOnCard }]}>
                    {label}
                  </Text>
                  <MoneyText
                    amount={amount}
                    variant="compact"
                    style={{
                      color: strongOnCard,
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
        <RNView style={[styles.dividerLine, { backgroundColor: cardBorder }]} />
        <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>
          BILLS DUE THIS MONTH
        </Text>
        <RNView style={[styles.dividerLine, { backgroundColor: cardBorder }]} />
      </RNView>

      <RNView
        style={[
          styles.billsCard,
          {
            backgroundColor: billsCardBg,
            borderColor: cardBorder,
          },
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
                  borderBottomWidth: 1,
                  borderBottomColor: cardBorder,
                },
              ]}
            >
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
  brandLogo: {
    width: 24,
    height: 24,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontFamily: typeface.displayRegular,
    fontSize: 18,
    lineHeight: 18,
    letterSpacing: -0.45,
  },
  subtitle: {
    fontFamily: typeface.regular,
    fontSize: 13,
    marginTop: 4,
  },
  monthCard: {
    borderRadius: 22,
    padding: spacing.lg,
    gap: spacing.md,
  },
  monthTop: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  monthMeta: {
    flex: 1,
  },
  nextLabel: {
    fontFamily: typeface.bold,
    fontSize: 11,
    letterSpacing: 0.9,
    marginBottom: 6,
  },
  monthName: {
    fontFamily: typeface.bold,
    fontSize: 22,
    letterSpacing: -0.35,
  },
  paydayLine: {
    fontFamily: typeface.regular,
    fontSize: 13,
    marginTop: 4,
  },
  cushionBadge: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "flex-end",
    minWidth: 92,
  },
  cushionBadgeLabel: {
    fontFamily: typeface.bold,
    fontSize: 10,
    letterSpacing: 0.9,
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
    gap: 5,
  },
  statColLabel: {
    fontFamily: typeface.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
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
    fontFamily: typeface.semibold,
    fontSize: 11,
    letterSpacing: 1,
  },
  billsCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
  },
  empty: {
    fontFamily: typeface.regular,
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
  billLabel: {
    flex: 1,
    fontFamily: typeface.medium,
    fontSize: 15,
  },
});
