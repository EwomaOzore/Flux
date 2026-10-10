import { MoneyText } from "@/components/MoneyText";
import { PaidCheck } from "@/components/PaidCheck";
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
  type MonthId,
} from "@/src/domain/month";
import { isPaidInMonth, type BillItem } from "@/src/domain/types";
import {
  defaultReminderPrefs,
  loadReminderPrefs,
} from "@/src/lib/paydayReminders";
import { useBudgetStore } from "@/src/state/budgetStore";
import { useFocusEffect } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/tabs";
import { useCallback, useMemo, useState } from "react";
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
  const [paydayDay, setPaydayDay] = useState(defaultReminderPrefs().dayOfMonth);
  const updateBill = useBudgetStore((s) => s.updateBill);
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

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void loadReminderPrefs().then((prefs) => {
        if (!cancelled) setPaydayDay(prefs.dayOfMonth);
      });
      return () => {
        cancelled = true;
      };
    }, []),
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
      budget.billItems,
      budget.lines,
    );
  }, [budget, paydayMonth]);

  const billGroups = useMemo(() => {
    const before: BillItem[] = [];
    const after: BillItem[] = [];
    for (const bill of budget.billItems) {
      if (bill.amount <= 0) continue;
      if (bill.dueDay != null && bill.dueDay > paydayDay) after.push(bill);
      else before.push(bill);
    }
    const byDue = (a: BillItem, b: BillItem) =>
      (a.dueDay ?? 32) - (b.dueDay ?? 32);
    before.sort(byDue);
    after.sort(byDue);
    return { before, after };
  }, [budget.billItems, paydayDay]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop: insets.top + 1,
          paddingBottom: Math.max(spacing.xl + 40, tabBarHeight + spacing.md),
        },
      ]}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never"
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

      <BillGroup
        title="DUE BEFORE PAYDAY"
        bills={billGroups.before}
        emptyLabel="Nothing due before payday. Bills without a due day stay in this list."
        paydayMonth={paydayMonth}
        palette={palette}
        cardBorder={cardBorder}
        billsCardBg={billsCardBg}
        onTogglePaid={(bill) =>
          updateBill(bill.id, {
            paidMonth: isPaidInMonth(bill.paidMonth, paydayMonth)
              ? undefined
              : paydayMonth,
          })
        }
      />
      {billGroups.after.length > 0 ? (
        <BillGroup
          title="AFTER PAYDAY"
          bills={billGroups.after}
          paydayMonth={paydayMonth}
          palette={palette}
          cardBorder={cardBorder}
          billsCardBg={billsCardBg}
          onTogglePaid={(bill) =>
            updateBill(bill.id, {
              paidMonth: isPaidInMonth(bill.paidMonth, paydayMonth)
                ? undefined
                : paydayMonth,
            })
          }
        />
      ) : null}
    </ScrollView>
  );
}

function BillGroup({
  title,
  bills,
  emptyLabel,
  paydayMonth,
  palette,
  cardBorder,
  billsCardBg,
  onTogglePaid,
}: {
  title: string;
  bills: BillItem[];
  emptyLabel?: string;
  paydayMonth: MonthId;
  palette: (typeof Colors)["light"];
  cardBorder: string;
  billsCardBg: string;
  onTogglePaid: (bill: BillItem) => void;
}) {
  return (
    <>
      <RNView style={styles.sectionDivider}>
        <RNView style={[styles.dividerLine, { backgroundColor: cardBorder }]} />
        <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>
          {title}
        </Text>
        <RNView style={[styles.dividerLine, { backgroundColor: cardBorder }]} />
      </RNView>
      <RNView
        style={[
          styles.billsCard,
          { backgroundColor: billsCardBg, borderColor: cardBorder },
        ]}
      >
        {bills.length === 0 ? (
          <Text style={[styles.empty, { color: palette.textMuted }]}>
            {emptyLabel ?? "Nothing here."}
          </Text>
        ) : (
          bills.map((bill, i) => {
            const paid = isPaidInMonth(bill.paidMonth, paydayMonth);
            const name = bill.label.trim() || "Bill";
            return (
              <RNView
                key={bill.id}
                style={[
                  styles.billRow,
                  i < bills.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: cardBorder,
                  },
                ]}
              >
                <PaidCheck
                  paid={paid}
                  label={name}
                  color="#FFFFFF"
                  borderColor={cardBorder}
                  fillColor={palette.tint}
                  onToggle={() => onTogglePaid(bill)}
                />
                <RNView style={styles.billText}>
                  <Text
                    style={[
                      styles.billLabel,
                      {
                        color: paid ? palette.textMuted : palette.text,
                        textDecorationLine: paid ? "line-through" : "none",
                      },
                    ]}
                  >
                    {name}
                  </Text>
                  <Text style={[styles.billDue, { color: palette.textMuted }]}>
                    {bill.dueDay != null
                      ? `Due the ${bill.dueDay}${ordinal(bill.dueDay)}`
                      : "No due day"}
                  </Text>
                </RNView>
                <MoneyText
                  amount={bill.amount}
                  style={{
                    color: paid ? palette.textMuted : palette.accentBills,
                  }}
                />
              </RNView>
            );
          })
        )}
      </RNView>
    </>
  );
}

function ordinal(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
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
    fontFamily: typeface.medium,
    fontSize: 15,
  },
  billText: {
    flex: 1,
    gap: 2,
  },
  billDue: {
    fontFamily: typeface.regular,
    fontSize: 12,
  },
});
