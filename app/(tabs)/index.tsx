import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useMemo, useState } from "react";
import {
  Pressable,
  View as RNView,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";

import { BrandMark } from "@/components/BrandMark";
import { DiscretionaryInfoModal } from "@/components/DiscretionaryInfoModal";
import { MoneyText } from "@/components/MoneyText";
import { QuickAddLineSheet } from "@/components/QuickAddLineSheet";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors, { type ThemePalette } from "@/constants/Colors";
import { cardElevation, radii, spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import { buildRollupsFromStreams } from "@/src/domain/engine";
import {
  addMonthsId,
  currentPaydayMonthId,
  formatMonthIdDisplay,
} from "@/src/domain/month";
import {
  incomeNgnForMonth,
  totalBillsAmount,
  type BillItem,
  type IncomeStream,
  type PaydayLine,
} from "@/src/domain/types";
import { useBudgetStore } from "@/src/state/budgetStore";

type MonthFeedItem = {
  id: string;
  label: string;
  amount: number;
  kind: "income" | "bill" | "outflow";
};

function buildMonthFeed(
  month: string,
  streams: IncomeStream[],
  bills: BillItem[],
  lines: PaydayLine[],
): MonthFeedItem[] {
  const items: MonthFeedItem[] = [];

  for (const stream of streams) {
    const rec = stream.recurrence ?? "recurring";
    const include =
      rec === "recurring" ||
      (rec === "one_time" && stream.oneTimeMonth === month);
    if (!include || stream.amountNgn <= 0) continue;
    items.push({
      id: `income-${stream.id}`,
      label: stream.label.trim() || "Income",
      amount: stream.amountNgn,
      kind: "income",
    });
  }

  for (const bill of bills) {
    if (bill.amount <= 0) continue;
    items.push({
      id: `bill-${bill.id}`,
      label: bill.label.trim() || "Bill",
      amount: -bill.amount,
      kind: "bill",
    });
  }

  for (const line of lines) {
    const start = line.startMonth ?? line.month;
    const end = line.endMonth ?? line.month;
    const inRange =
      line.recurrence === "monthly"
        ? month >= start && month <= end
        : line.month === month;
    if (!inRange || line.amount <= 0) continue;
    items.push({
      id: `line-${line.id}`,
      label: line.label.trim() || "Outflow",
      amount: -line.amount,
      kind: "outflow",
    });
  }

  return items;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const paydayMonth = currentPaydayMonthId();
  const budgetForRollup = useBudgetStore(
    useShallow((s) => ({
      incomeStreams: s.incomeStreams,
      billItems: s.billItems,
      lines: s.lines,
    })),
  );
  const [infoOpen, setInfoOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const billsTotal = useMemo(
    () => totalBillsAmount(budgetForRollup.billItems),
    [budgetForRollup.billItems],
  );

  const roll = useMemo(
    () =>
      buildRollupsFromStreams(
        [paydayMonth],
        budgetForRollup.incomeStreams,
        billsTotal,
        budgetForRollup.lines,
      )[0],
    [budgetForRollup, paydayMonth, billsTotal],
  );

  const prevMonth = useMemo(() => addMonthsId(paydayMonth, -1), [paydayMonth]);
  const prevRoll = useMemo(
    () =>
      buildRollupsFromStreams(
        [prevMonth],
        budgetForRollup.incomeStreams,
        billsTotal,
        budgetForRollup.lines,
      )[0],
    [budgetForRollup, prevMonth, billsTotal],
  );

  const cushion = roll?.cushionAfterBills ?? 0;
  const positive = cushion >= 0;
  const vsLast = cushion - (prevRoll?.cushionAfterBills ?? 0);

  const feed = useMemo(
    () =>
      buildMonthFeed(
        paydayMonth,
        budgetForRollup.incomeStreams,
        budgetForRollup.billItems,
        budgetForRollup.lines,
      ),
    [budgetForRollup, paydayMonth],
  );

  const incomeForMonth = useMemo(
    () => incomeNgnForMonth(budgetForRollup.incomeStreams, paydayMonth),
    [budgetForRollup.incomeStreams, paydayMonth],
  );

  return (
    <RNView style={[styles.screen, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: Math.max(spacing.xl + 72, tabBarHeight + spacing.md),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <RNView style={styles.container}>
          <RNView style={styles.headerRow}>
            <RNView style={styles.brandLockup}>
              <BrandMark size={26} />
              <Text style={[styles.brandName, { color: palette.text }]}>
                flux
              </Text>
            </RNView>
            <Text style={[styles.monthChip, { color: palette.textMuted }]}>
              {formatMonthIdDisplay(paydayMonth).replace(",", "")}
            </Text>
          </RNView>

          <Pressable
            accessibilityRole="button"
            accessibilityHint="Shows how cushion is calculated"
            onPress={() => setInfoOpen(true)}
            style={({ pressed }) => [
              styles.hero,
              {
                backgroundColor: palette.surface,
                opacity: pressed ? 0.97 : 1,
              },
              cardElevation(colorScheme),
            ]}
          >
            <Text style={[styles.heroLabel, { color: palette.textMuted }]}>
              CUSHION AFTER BILLS
            </Text>
            <MoneyText
              amount={cushion}
              variant="titleEmphasis"
              style={{ color: positive ? palette.tint : palette.danger }}
            />
            <RNView style={styles.heroMeta}>
              <RNView
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: positive
                      ? palette.successMuted
                      : palette.dangerMuted,
                  },
                ]}
              >
                <RNView
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: positive
                        ? palette.success
                        : palette.danger,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: positive ? palette.success : palette.danger },
                  ]}
                >
                  {positive ? "Healthy cushion" : "Below bills"}
                </Text>
              </RNView>
              <RNView style={styles.vsLastRow}>
                <MoneyText
                  amount={vsLast}
                  variant="compact"
                  signed
                  style={{ color: palette.textMuted, fontSize: 13 }}
                />
                <Text style={[styles.vsLast, { color: palette.textMuted }]}>
                  {" "}
                  vs last
                </Text>
              </RNView>
            </RNView>
          </Pressable>

          <RNView style={styles.statRow}>
            <StatCard
              label="INCOME"
              amount={incomeForMonth}
              background={palette.accentIncomeMuted}
              valueColor={palette.accentIncome}
              palette={palette}
            />
            <StatCard
              label="BILLS"
              amount={roll?.billsTotal ?? 0}
              background={palette.accentBillsMuted}
              valueColor={palette.accentBills}
              palette={palette}
            />
            <StatCard
              label="OUTFLOWS"
              amount={roll?.totalPaydayOutflow ?? 0}
              background={palette.accentOutflowMuted}
              valueColor={palette.accentOutflow}
              palette={palette}
            />
          </RNView>

          <RNView style={styles.sectionDivider}>
            <RNView
              style={[styles.dividerLine, { backgroundColor: palette.border }]}
            />
            <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>
              THIS MONTH
            </Text>
            <RNView
              style={[styles.dividerLine, { backgroundColor: palette.border }]}
            />
          </RNView>

          {feed.length === 0 ? (
            <RNView
              style={[
                styles.emptyCard,
                { backgroundColor: palette.surface },
                cardElevation(colorScheme),
              ]}
            >
              <Text style={[styles.empty, { color: palette.textMuted }]}>
                Nothing planned yet. Add income, bills, or a payday outflow in
                Plan — or tap + below.
              </Text>
            </RNView>
          ) : (
            <RNView
              style={[
                styles.listCard,
                { backgroundColor: palette.surface },
                cardElevation(colorScheme),
              ]}
            >
              {feed.map((item, i) => (
                <RNView
                  key={item.id}
                  style={[
                    styles.feedRow,
                    i < feed.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: palette.border,
                    },
                  ]}
                >
                  <RNView
                    style={[
                      styles.feedDot,
                      {
                        backgroundColor:
                          item.kind === "income"
                            ? palette.accentIncome
                            : item.kind === "bill"
                              ? palette.accentBills
                              : palette.accentOutflow,
                      },
                    ]}
                  />
                  <Text
                    style={[styles.feedLabel, { color: palette.text }]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  <MoneyText
                    amount={item.amount}
                    signed
                    style={[
                      styles.feedAmount,
                      {
                        color:
                          item.amount >= 0
                            ? palette.accentIncome
                            : palette.text,
                      },
                    ]}
                  />
                </RNView>
              ))}
            </RNView>
          )}
        </RNView>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quick add payday outflow"
        onPress={() => setQuickAddOpen(true)}
        style={({ pressed }) => [
          styles.quickFab,
          {
            backgroundColor: palette.tint,
            bottom: Math.max(spacing.lg, tabBarHeight + spacing.xs),
            opacity: pressed ? 0.9 : 1,
          },
          cardElevation(colorScheme),
        ]}
      >
        <Text style={styles.quickFabText}>+</Text>
      </Pressable>

      <DiscretionaryInfoModal
        visible={infoOpen}
        onClose={() => setInfoOpen(false)}
        monthLabel={formatMonthIdDisplay(paydayMonth)}
        income={roll?.income ?? 0}
        billsTotal={roll?.billsTotal ?? 0}
        paydayOutflow={roll?.totalPaydayOutflow ?? 0}
        cushion={cushion}
      />
      <QuickAddLineSheet
        visible={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        initialMonth={paydayMonth}
      />
    </RNView>
  );
}

function StatCard({
  label,
  amount,
  background,
  valueColor,
  palette,
}: Readonly<{
  label: string;
  amount: number;
  background: string;
  valueColor: string;
  palette: ThemePalette;
}>) {
  return (
    <RNView style={[styles.statCard, { backgroundColor: background }]}>
      <Text style={[styles.statLabel, { color: palette.textMuted }]}>
        {label}
      </Text>
      <MoneyText
        amount={amount}
        variant="compact"
        signed={false}
        style={{ color: valueColor, fontSize: 16 }}
      />
    </RNView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  brandLockup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  brandName: {
    fontFamily: typeface.display,
    fontSize: 28,
    letterSpacing: -0.6,
  },
  monthChip: {
    fontSize: 13,
    fontWeight: "500",
  },
  hero: {
    borderRadius: radii.xxl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.1,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  vsLastRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  vsLast: {
    fontSize: 13,
  },
  statRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
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
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
  emptyCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
  },
  listCard: {
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  feedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  feedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  feedLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  feedAmount: {
    fontSize: 15,
  },
  quickFab: {
    position: "absolute",
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  quickFabText: {
    color: "#fff",
    fontSize: 32,
    lineHeight: 34,
    fontFamily: typeface.bold,
    marginTop: -2,
  },
});
