import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useMemo, useState } from "react";
import {
  View as RNView,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { useShallow } from "zustand/react/shallow";

import { DeferLineToNextMonthButton } from "@/components/DeferLineToNextMonthButton";
import { DiscretionaryInfoModal } from "@/components/DiscretionaryInfoModal";
import { MoneyText } from "@/components/MoneyText";
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors, { type ThemePalette } from "@/constants/Colors";
import {
  cardElevation,
  hairlineBorder,
  radii,
  spacing,
} from "@/constants/theme";
import { buildRollupsFromStreams } from "@/src/domain/engine";
import {
  addMonthsId,
  currentPaydayMonthId,
  formatMonthIdDisplay,
} from "@/src/domain/month";
import { totalBillsAmount } from "@/src/domain/types";
import { formatNgn } from "@/src/lib/formatCurrency";
import { planningStreakMonths } from "@/src/lib/planningInsights";
import {
  rollupForCurrentPayday,
  rollupsThroughMonth,
  useBudgetStore,
} from "@/src/state/budgetStore";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const tabBarHeight = useBottomTabBarHeight();
  const paydayMonth = currentPaydayMonthId();
  const incomeStreamCount = useBudgetStore((s) => s.incomeStreams.length);
  const budgetForRollup = useBudgetStore(
    useShallow((s) => ({
      incomeStreams: s.incomeStreams,
      billItems: s.billItems,
      lines: s.lines,
    })),
  );
  const [infoOpen, setInfoOpen] = useState(false);
  const roll = useMemo(
    () => rollupForCurrentPayday(budgetForRollup),
    [budgetForRollup, paydayMonth],
  );

  const prevMonth = useMemo(() => addMonthsId(paydayMonth, -1), [paydayMonth]);
  const prevRoll = useMemo(() => {
    const rolls = rollupsThroughMonth(budgetForRollup, paydayMonth);
    return (
      rolls.find((r) => r.month === prevMonth) ??
      buildRollupsFromStreams(
        [prevMonth],
        budgetForRollup.incomeStreams,
        totalBillsAmount(budgetForRollup.billItems),
        budgetForRollup.lines,
      )[0]
    );
  }, [budgetForRollup, prevMonth]);

  const streak = useMemo(
    () => planningStreakMonths(budgetForRollup.lines, paydayMonth),
    [budgetForRollup.lines, paydayMonth],
  );

  const cushion = roll?.cushionAfterBills ?? 0;
  const positive = cushion >= 0;
  const cushionColor = positive ? palette.success : palette.danger;
  const cushionBg = positive ? palette.successMuted : palette.dangerMuted;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingBottom: Math.max(spacing.xl, tabBarHeight + spacing.md) },
      ]}
      style={{ backgroundColor: palette.background }}
      showsVerticalScrollIndicator={false}
    >
      <RNView style={styles.decorTop}>
        <RNView style={[styles.decorBlob, { backgroundColor: palette.tint }]} />
        <RNView
          style={[styles.decorBlob2, { backgroundColor: palette.info }]}
        />
      </RNView>

      <View style={styles.container}>
        <RNView style={[styles.brandRow, hairlineBorder(palette.border)]}>
          <RNView
            style={[styles.brandDot, { backgroundColor: palette.tint }]}
          />
          <Text style={[styles.brandText, { color: palette.textSecondary }]}>
            Payday snapshot
          </Text>
        </RNView>

        <Text style={[styles.kicker, { color: palette.tintStrong }]}>
          End-of-month payday
        </Text>
        <Text style={styles.monthLabel}>
          {formatMonthIdDisplay(paydayMonth)}
        </Text>
        <Text style={[styles.caption, { color: palette.textSecondary }]}>
          Salary lands for the month ahead; big bills hit the same run.
          {incomeStreamCount > 1
            ? ` You have ${incomeStreamCount} income streams combined below.`
            : null}
        </Text>

        <RNView
          style={[
            styles.hero,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
            cardElevation(colorScheme),
          ]}
        >
          <RNView
            style={[styles.heroAccent, { backgroundColor: palette.tint }]}
          />
          <RNView style={[styles.cushionBadge, { backgroundColor: cushionBg }]}>
            <Text style={[styles.cushionBadgeLabel, { color: cushionColor }]}>
              {positive ? "Healthy cushion" : "Below bills"}
            </Text>
          </RNView>
          <Text style={[styles.heroLabel, { color: palette.textSecondary }]}>
            Cushion after bills
          </Text>
          <MoneyText
            amount={cushion}
            variant="titleEmphasis"
            style={{ color: cushionColor }}
          />
          <RNView style={styles.statRow}>
            <StatChip
              label="Income (₦)"
              value={formatNgn(roll?.income ?? 0)}
              accent={palette.accentBlue}
              muted={palette.infoMuted}
              palette={palette}
            />
            <StatChip
              label="Bills"
              value={formatNgn(roll?.billsTotal ?? 0)}
              accent={palette.accentViolet}
              muted={palette.tintMuted}
              palette={palette}
            />
            <StatChip
              label="Payday out"
              value={formatNgn(roll?.totalPaydayOutflow ?? 0)}
              accent={palette.accentAmber}
              muted={palette.warningMuted}
              palette={palette}
            />
          </RNView>
          <Text style={[styles.insight, { color: palette.textSecondary }]}>
            {positive
              ? `You have about ${formatNgn(cushion)} left for discretionary spending this payday — after bills and the line items you’ve planned.`
              : `You’re short about ${formatNgn(Math.abs(cushion))} after bills and planned outflows — trim a line or defer one.`}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Shows how cushion is calculated"
            onPress={() => setInfoOpen(true)}
            style={({ pressed }) => [
              styles.infoLinkRow,
              { opacity: pressed ? 0.75 : 1 },
            ]}>
            <Text style={[styles.infoLink, { color: palette.tint }]}>
              What&apos;s included? Bills vs payday lines
            </Text>
          </Pressable>

          <RNView
            style={[
              styles.compareCard,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              },
              hairlineBorder(palette.border),
            ]}>
            <Text style={[styles.compareTitle, { color: palette.textMuted }]}>
              Cushion snapshot
            </Text>
            <Text style={[styles.compareBody, { color: palette.textSecondary }]}>
              Last payday ({formatMonthIdDisplay(prevMonth)}):{" "}
              <Text style={{ fontWeight: "700", color: palette.text }}>
                {formatNgn(prevRoll.cushionAfterBills)}
              </Text>
              {" · "}
              This payday ({formatMonthIdDisplay(paydayMonth)}):{" "}
              <Text style={{ fontWeight: "700", color: palette.text }}>
                {formatNgn(cushion)}
              </Text>
            </Text>
            <Text style={[styles.compareHint, { color: palette.textMuted }]}>
              No score — just visibility across paydays.
            </Text>
          </RNView>

          {streak >= 2 ? (
            <Text style={[styles.streakLine, { color: palette.textMuted }]}>
              You&apos;ve logged spending {streak} paydays in a row. Steady rhythm.
            </Text>
          ) : null}
        </RNView>

        <DiscretionaryInfoModal
          visible={infoOpen}
          onClose={() => setInfoOpen(false)}
          monthLabel={formatMonthIdDisplay(paydayMonth)}
          income={roll?.income ?? 0}
          billsTotal={roll?.billsTotal ?? 0}
          paydayOutflow={roll?.totalPaydayOutflow ?? 0}
          cushion={cushion}
        />

        <RNView style={styles.sectionHead}>
          <RNView
            style={[styles.sectionBar, { backgroundColor: palette.tint }]}
          />
          <Text style={styles.sectionTitle}>{"This payday's line items"}</Text>
        </RNView>

        {(roll?.lines.length ?? 0) === 0 ? (
          <RNView
            style={[
              styles.emptyCard,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              },
              hairlineBorder(palette.border),
            ]}
          >
            <Text style={[styles.empty, { color: palette.textMuted }]}>
              Nothing here yet. Add one thing you&apos;re saving for — rent top-up, a trip, a bill — so this payday
              reflects real life.
            </Text>
          </RNView>
        ) : (
          <RNView
            style={[
              styles.linesCard,
              { backgroundColor: palette.surface, borderColor: palette.border },
              cardElevation(colorScheme),
            ]}
          >
            {roll!.lines.map((l, i) => (
              <RNView
                key={l.id}
                style={[
                  styles.lineRow,
                  i < roll!.lines.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: palette.border,
                  },
                ]}
              >
                <RNView
                  style={[
                    styles.lineDot,
                    { backgroundColor: palette.accentViolet },
                  ]}
                />
                <Text style={[styles.lineLabel, { color: palette.text }]}>
                  {l.label}
                </Text>
                <DeferLineToNextMonthButton line={l} />
                <MoneyText
                  amount={-l.amount}
                  style={[styles.lineAmount, { color: palette.danger }]}
                />
              </RNView>
            ))}
          </RNView>
        )}
      </View>
    </ScrollView>
  );
}

function StatChip({
  label,
  value,
  accent,
  muted,
  palette,
}: {
  label: string;
  value: string;
  accent: string;
  muted: string;
  palette: ThemePalette;
}) {
  return (
    <RNView style={[styles.statChip, { backgroundColor: muted }]}>
      <Text style={[styles.statChipLabel, { color: palette.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.statChipValue, { color: accent }]} numberOfLines={1}>
        {value}
      </Text>
    </RNView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  decorTop: {
    height: 120,
    marginBottom: -72,
    overflow: "hidden",
  },
  decorBlob: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -80,
    right: -40,
    opacity: 0.85,
  },
  decorBlob2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    top: -20,
    left: -50,
    opacity: 0.55,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    gap: spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginBottom: spacing.sm,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  brandText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: spacing.xs,
  },
  monthLabel: {
    fontSize: 36,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: -1,
  },
  caption: {
    marginTop: spacing.xs,
    fontSize: 15,
    lineHeight: 22,
  },
  hero: {
    marginTop: spacing.lg,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  heroAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cushionBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
  },
  cushionBadgeLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statChip: {
    flexGrow: 1,
    minWidth: "28%",
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  statChipLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  statChipValue: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  insight: {
    marginTop: spacing.md,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  infoLinkRow: {
    marginTop: spacing.sm,
    minHeight: 44,
    justifyContent: "center",
  },
  infoLink: {
    fontSize: 15,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  compareCard: {
    marginTop: spacing.md,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  compareTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  compareBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  compareHint: {
    fontSize: 12,
    marginTop: spacing.sm,
    lineHeight: 17,
  },
  streakLine: {
    marginTop: spacing.md,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  sectionBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  emptyCard: {
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
  },
  linesCard: {
    marginTop: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  lineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lineLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
  lineAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
});
