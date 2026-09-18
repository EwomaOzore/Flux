import { DiscretionaryInfoModal } from "@/components/DiscretionaryInfoModal";
import { MoneyText } from "@/components/MoneyText";
import { QuickAddLineSheet } from "@/components/QuickAddLineSheet";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { cardElevation, radii, spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import { buildRollupsFromStreams } from "@/src/domain/engine";
import {
  addMonthsId,
  compareMonthId,
  currentPaydayMonthId,
  formatMonthIdDisplay,
  type MonthId,
} from "@/src/domain/month";
import {
  incomeNgnForMonth,
  totalBillsAmount,
  type BillItem,
  type IncomeStream,
  type PaydayLine,
} from "@/src/domain/types";
import { useBudgetStore } from "@/src/state/budgetStore";
import { useCurrencyStore } from "@/src/state/currencyStore";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  View as RNView,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";

const brandLogo = require("../../assets/images/FluxLogo.png");

type MonthFeedItem = {
  id: string;
  label: string;
  amount: number;
  kind: "income" | "bill" | "outflow";
};

function greetingName(raw: string): string {
  const first = raw.trim().split(/\s+/)[0] ?? "";
  return first;
}

function buildMonthFeed(
  month: MonthId,
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
    const end = line.endMonth ?? start;
    const inRange =
      line.recurrence === "monthly"
        ? compareMonthId(month, start) >= 0 && compareMonthId(month, end) <= 0
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
  const displayName = useCurrencyStore((s) => s.displayName);
  const hiName = greetingName(displayName);

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
              <Image source={brandLogo} style={styles.brandLogo} />
              <Text style={[styles.brandName, { color: palette.text }]}>
                flux
              </Text>
            </RNView>
            <Text style={[styles.monthChip, { color: palette.textMuted }]}>
              {formatMonthIdDisplay(paydayMonth).replace(",", "")}
            </Text>
          </RNView>

          {hiName ? (
            <Text
              style={[styles.greeting, { color: palette.text }]}
              accessibilityRole="header"
            >
              Hi {hiName}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityHint="Shows how cushion is calculated"
            onPress={() => setInfoOpen(true)}
            style={({ pressed }) => [
              styles.hero,
              {
                backgroundColor: palette.surface,
                borderColor: palette.cardBorder,
                opacity: pressed ? 0.97 : 1,
              },
            ]}
          >
            <Text style={[styles.heroLabel, { color: palette.textMuted }]}>
              CUSHION AFTER BILLS
            </Text>
            <MoneyText
              amount={cushion}
              variant="hero"
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
                  style={[styles.vsLast, { color: palette.textMuted }]}
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
              borderColor={palette.cardBorder}
              labelColor={palette.textMuted}
            />
            <StatCard
              label="BILLS"
              amount={roll?.billsTotal ?? 0}
              background={palette.accentBillsMuted}
              valueColor={palette.accentBills}
              borderColor={palette.cardBorder}
              labelColor={palette.textMuted}
            />
            <StatCard
              label="OUTFLOWS"
              amount={roll?.totalPaydayOutflow ?? 0}
              background={palette.accentOutflowMuted}
              valueColor={palette.accentOutflow}
              borderColor={palette.cardBorder}
              labelColor={palette.textMuted}
            />
          </RNView>

          <RNView style={styles.sectionDivider}>
            <RNView
              style={[
                styles.dividerLine,
                { backgroundColor: palette.cardBorder },
              ]}
            />
            <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>
              THIS MONTH
            </Text>
            <RNView
              style={[
                styles.dividerLine,
                { backgroundColor: palette.cardBorder },
              ]}
            />
          </RNView>

          {feed.length === 0 ? (
            <RNView
              style={[
                styles.emptyCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.cardBorder,
                },
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
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.cardBorder,
                },
              ]}
            >
              {feed.map((item, i) => (
                <RNView
                  key={item.id}
                  style={[
                    styles.feedRow,
                    i < feed.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: palette.cardBorder,
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
                    style={[styles.feedLabel, { color: palette.textSecondary }]}
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
            backgroundColor: "#48B872",
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
        onAdded={(month) => {
          if (month === paydayMonth) return;
          Alert.alert(
            "Saved",
            `Added for ${formatMonthIdDisplay(month)}. Home shows this month only — open Plan or Timeline to see it.`,
          );
        }}
      />
    </RNView>
  );
}

function StatCard({
  label,
  amount,
  background,
  valueColor,
  borderColor,
  labelColor,
}: Readonly<{
  label: string;
  amount: number;
  background: string;
  valueColor: string;
  borderColor: string;
  labelColor: string;
}>) {
  return (
    <RNView
      style={[styles.statCard, { backgroundColor: background, borderColor }]}
    >
      <Text style={[styles.statLabel, { color: labelColor }]}>{label}</Text>
      <MoneyText
        amount={amount}
        variant="stat"
        signed={false}
        style={{ color: valueColor }}
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
  greeting: {
    fontFamily: typeface.displayRegular,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    marginBottom: spacing.xs,
  },
  brandLockup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  brandLogo: {
    width: 24,
    height: 24,
  },
  brandName: {
    fontFamily: typeface.displayRegular,
    fontSize: 18,
    lineHeight: 18,
    letterSpacing: -0.45,
    marginTop: 4,
  },
  monthChip: {
    fontSize: 13,
    fontWeight: "500",
  },
  hero: {
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 22,
    gap: spacing.sm,
  },
  heroLabel: {
    fontFamily: typeface.bold,
    fontSize: 10,
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
    fontFamily: typeface.regular,
    fontSize: 12,
  },
  statRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  statLabel: {
    fontFamily: typeface.bold,
    fontSize: 9,
    lineHeight: 13.5,
    letterSpacing: 0.72,
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
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.lg,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
  },
  listCard: {
    borderRadius: 14,
    borderWidth: 1,
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
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  feedLabel: {
    flex: 1,
    fontFamily: typeface.regular,
    fontSize: 14,
  },
  feedAmount: {
    fontSize: 15,
  },
  quickFab: {
    position: "absolute",
    right: spacing.lg,
    width: 52,
    height: 52,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  quickFabText: {
    color: "#fff",
    fontSize: 22,
  },
});
