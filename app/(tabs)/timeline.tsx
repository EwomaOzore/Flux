import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  View as RNView,
  StyleSheet,
} from "react-native";
import { useShallow } from "zustand/react/shallow";

import { DeferLineToNextMonthButton } from "@/components/DeferLineToNextMonthButton";
import { MoneyText } from "@/components/MoneyText";
import { MonthPickerField } from "@/components/MonthPickerField";
import { QuickAddLineSheet } from "@/components/QuickAddLineSheet";
import { Text, View } from "@/components/Themed";
import { FluxTextInput } from "@/components/ui";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  cardElevation,
  hairlineBorder,
  radii,
  spacing,
} from "@/constants/theme";
import {
  currentPaydayMonthId,
  formatMonthIdDisplay,
  type MonthId,
} from "@/src/domain/month";
import type { MonthRollup, PaydayLine } from "@/src/domain/types";
import { computeRollups, useBudgetStore } from "@/src/state/budgetStore";
import { scheduleLineUndo } from "@/src/state/lineUndoStore";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const ACCENTS = [
  "tint",
  "accentBlue",
  "accentViolet",
  "accentAmber",
  "accentRose",
] as const;

function HighlightedLabel({
  label,
  query,
  textColor,
  highlightColor,
}: Readonly<{
  label: string;
  query: string;
  textColor: string;
  highlightColor: string;
}>) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return (
      <Text style={[styles.lineLabel, { color: textColor }]}>{label}</Text>
    );
  }
  const lower = label.toLowerCase();
  const at = lower.indexOf(q);
  if (at < 0) {
    return (
      <Text style={[styles.lineLabel, { color: textColor }]}>{label}</Text>
    );
  }
  const before = label.slice(0, at);
  const match = label.slice(at, at + q.length);
  const after = label.slice(at + q.length);
  return (
    <Text style={[styles.lineLabel, { color: textColor }]}>
      {before}
      <Text style={[styles.lineLabelMatch, { color: highlightColor }]}>
        {match}
      </Text>
      {after}
    </Text>
  );
}

export default function TimelineScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const tabBarHeight = useBottomTabBarHeight();
  const budgetForRollup = useBudgetStore(
    useShallow((s) => ({
      incomeStreams: s.incomeStreams,
      billItems: s.billItems,
      lines: s.lines,
    })),
  );
  const rollups = useMemo(
    () => computeRollups(budgetForRollup),
    [budgetForRollup],
  );
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [monthFilterEnabled, setMonthFilterEnabled] = useState(false);
  const [monthFilter, setMonthFilter] = useState<MonthId>(
    currentPaydayMonthId(),
  );
  const deleteLine = useBudgetStore((s) => s.deleteLine);
  const query = searchText.trim().toLowerCase();
  const allMonthsSelected = monthFilterEnabled === false;
  const hasFilters = query.length > 0 || monthFilterEnabled;

  const filteredRollups = useMemo(() => {
    const byMonth = monthFilterEnabled
      ? rollups.filter((r) => r.month === monthFilter)
      : rollups;
    if (!query) return byMonth;
    return byMonth
      .map((r) => ({
        ...r,
        lines: r.lines.filter((l) => l.label.toLowerCase().includes(query)),
      }))
      .filter(
        (r) =>
          r.lines.length > 0 ||
          formatMonthIdDisplay(r.month).toLowerCase().includes(query),
      );
  }, [monthFilter, monthFilterEnabled, query, rollups]);

  const onDelete = (line: PaydayLine) => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scheduleLineUndo({ kind: "delete", line });
    deleteLine(line.id);
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: MonthRollup;
    index: number;
  }) => {
    const accentKey = ACCENTS[index % ACCENTS.length];
    const accentColor = palette[accentKey];
    const positive = item.cushionAfterBills >= 0;
    const cushionColor = positive ? palette.success : palette.danger;
    const cushionBg = positive ? palette.successMuted : palette.dangerMuted;

    return (
      <RNView
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
          cardElevation(colorScheme),
        ]}
      >
        <RNView style={[styles.cardAccent, { backgroundColor: accentColor }]} />
        <RNView style={styles.cardInner}>
          <RNView style={styles.cardHeader}>
            <RNView
              style={[styles.monthPill, { backgroundColor: palette.tintMuted }]}
            >
              <Text
                style={[styles.monthPillText, { color: palette.tintStrong }]}
              >
                {formatMonthIdDisplay(item.month)}
              </Text>
            </RNView>
            <RNView
              style={[styles.cushionBlock, { backgroundColor: cushionBg }]}
            >
              <Text style={[styles.cushionLabel, { color: cushionColor }]}>
                After bills
              </Text>
              <MoneyText
                amount={item.cushionAfterBills}
                style={{ color: cushionColor, fontWeight: "800" }}
              />
            </RNView>
          </RNView>

          <RNView style={[styles.metaRow, { borderColor: palette.border }]}>
            <Text style={[styles.metaMuted, { color: palette.textMuted }]}>
              Payday outflows
            </Text>
            <MoneyText
              amount={item.totalPaydayOutflow}
              style={[styles.metaValue, { color: palette.text }]}
            />
          </RNView>

          <RNView style={[styles.metaRow, { borderColor: palette.border }]}>
            <Text style={[styles.metaMuted, { color: palette.textMuted }]}>
              Monthly bills
            </Text>
            <MoneyText
              amount={item.billsTotal}
              style={[styles.metaValue, { color: palette.text }]}
            />
          </RNView>

          {item.lines.map((l, lineIdx) => (
            <RNView
              key={l.id}
              style={[
                styles.lineRow,
                lineIdx > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: palette.border,
                },
              ]}
            >
              <RNView
                style={[styles.lineAccent, { backgroundColor: accentColor }]}
              />
              <HighlightedLabel
                label={l.label}
                query={query}
                textColor={palette.text}
                highlightColor={palette.tintStrong}
              />
              <RNView style={styles.lineRight}>
                {l.recurrence === "monthly" ? (
                  <FontAwesome
                    name="repeat"
                    size={13}
                    color={palette.textMuted}
                  />
                ) : null}
                <MoneyText
                  amount={l.amount}
                  style={[styles.lineAmount, { color: palette.textSecondary }]}
                />
                <DeferLineToNextMonthButton line={l} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${l.label}`}
                  onPress={() => onDelete(l)}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.trash,
                    {
                      backgroundColor: pressed
                        ? palette.dangerMuted
                        : palette.surfaceMuted,
                    },
                  ]}
                >
                  <FontAwesome name="trash" size={15} color={palette.danger} />
                </Pressable>
              </RNView>
            </RNView>
          ))}
        </RNView>
      </RNView>
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredRollups}
        keyExtractor={(r) => r.month}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          filteredRollups.length === 0 && styles.listEmpty,
          { paddingBottom: Math.max(40, tabBarHeight + spacing.md) },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <RNView>
            <RNView
              style={[
                styles.introCard,
                {
                  backgroundColor: palette.infoMuted,
                  borderColor: palette.border,
                },
                hairlineBorder(palette.border),
              ]}
            >
              <Text style={[styles.introTitle, { color: palette.info }]}>
                How to read this
              </Text>
              <Text style={[styles.intro, { color: palette.textSecondary }]}>
                Each card ties a month to a payday outflow. We subtract your
                bills total (from Plan) plus those outflows from net pay to get
                cushion. Add bills and line items in Plan — months appear here
                automatically.
              </Text>
            </RNView>
            <View
              style={[
                styles.filterWrap,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
                hairlineBorder(palette.border),
              ]}
            >
              <FluxTextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search line items (e.g. rent, school)"
                style={styles.searchInput}
              />
              <View style={styles.filterRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: allMonthsSelected }}
                  onPress={() => setMonthFilterEnabled(false)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    {
                      borderColor: allMonthsSelected
                        ? palette.tint
                        : palette.border,
                      backgroundColor: allMonthsSelected
                        ? palette.tintMuted
                        : palette.surface,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: allMonthsSelected
                        ? palette.tintStrong
                        : palette.textSecondary,
                      fontWeight: "700",
                    }}
                  >
                    All months
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: monthFilterEnabled }}
                  onPress={() => {
                    setMonthFilterEnabled(true);
                    setMonthFilter(currentPaydayMonthId());
                  }}
                  style={({ pressed }) => [
                    styles.filterChip,
                    {
                      borderColor: monthFilterEnabled
                        ? palette.tint
                        : palette.border,
                      backgroundColor: monthFilterEnabled
                        ? palette.tintMuted
                        : palette.surface,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: monthFilterEnabled
                        ? palette.tintStrong
                        : palette.textSecondary,
                      fontWeight: "700",
                    }}
                  >
                    Pick month
                  </Text>
                </Pressable>
              </View>
              {monthFilterEnabled ? (
                <MonthPickerField
                  value={monthFilter}
                  onChange={setMonthFilter}
                  palette={palette}
                  triggerStyle={{
                    borderWidth: StyleSheet.hairlineWidth,
                    borderRadius: radii.md,
                    borderColor: palette.borderStrong,
                    backgroundColor: palette.surfaceMuted,
                  }}
                />
              ) : null}
              {hasFilters ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear timeline filters"
                  onPress={() => {
                    setSearchText("");
                    setMonthFilterEnabled(false);
                    setMonthFilter(currentPaydayMonthId());
                  }}
                  style={({ pressed }) => [
                    styles.clearFiltersBtn,
                    {
                      borderColor: palette.borderStrong,
                      backgroundColor: palette.surfaceMuted,
                      opacity: pressed ? 0.9 : 1,
                    },
                    hairlineBorder(palette.borderStrong),
                  ]}
                >
                  <Text
                    style={[
                      styles.clearFiltersText,
                      { color: palette.textSecondary },
                    ]}
                  >
                    Clear filters
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </RNView>
        }
        ListEmptyComponent={
          <RNView style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>
              {searchText.trim() || monthFilterEnabled
                ? "No matches"
                : "No timeline yet"}
            </Text>
            <Text style={[styles.emptyBody, { color: palette.textMuted }]}>
              {searchText.trim() || monthFilterEnabled
                ? "Try another keyword or clear month filters."
                : "Add one payday outflow in Plan — even a small line — so this view can show how each month's cushion looks after bills."}
            </Text>
          </RNView>
        }
      />
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
      <QuickAddLineSheet
        visible={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        initialMonth={currentPaydayMonthId()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    padding: spacing.lg,
  },
  listEmpty: {
    flexGrow: 1,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  introCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  introTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  intro: {
    fontSize: 14,
    lineHeight: 21,
  },
  filterWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  searchInput: {
    minHeight: 48,
  },
  filterRow: {
    flexDirection: "row",
    gap: 0,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  filterChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  cardAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  cardInner: {
    paddingLeft: spacing.lg + 2,
    paddingRight: spacing.md,
    paddingVertical: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  monthPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  monthPillText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  cushionBlock: {
    alignItems: "flex-end",
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 120,
  },
  cushionLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  metaMuted: {
    fontSize: 13,
    fontWeight: "600",
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.md,
  },
  lineAccent: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  lineLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
  },
  lineLabelMatch: {
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  lineRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  lineAmount: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  trash: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radii.sm,
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
    fontWeight: "800",
    marginTop: -2,
  },
  clearFiltersBtn: {
    minHeight: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
