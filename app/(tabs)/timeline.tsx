import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  View as RNView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";

import { BrandMark } from "@/components/BrandMark";
import { MoneyText } from "@/components/MoneyText";
import { Text, View } from "@/components/Themed";
import { FluxTextInput } from "@/components/ui";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { cardElevation, radii, spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import {
  formatMonthIdDisplay,
  formatMonthIdShort,
} from "@/src/domain/month";
import type { MonthRollup } from "@/src/domain/types";
import { formatMoney } from "@/src/lib/formatCurrency";
import { computeRollups, useBudgetStore } from "@/src/state/budgetStore";
import { useCurrencyStore } from "@/src/state/currencyStore";

export default function TimelineScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const budgetForRollup = useBudgetStore(
    useShallow((s) => ({
      incomeStreams: s.incomeStreams,
      billItems: s.billItems,
      lines: s.lines,
    })),
  );
  const deleteLine = useBudgetStore((s) => s.deleteLine);
  const rollups = useMemo(
    () => computeRollups(budgetForRollup),
    [budgetForRollup],
  );
  const [searchText, setSearchText] = useState("");
  const currencyCode = useCurrencyStore((s) => s.currencyCode);
  const query = searchText.trim().toLowerCase();

  const filteredRollups = useMemo(() => {
    if (!query) return rollups;
    return rollups.filter((r) => {
      const monthLabel = formatMonthIdDisplay(r.month).toLowerCase();
      const short = formatMonthIdShort(r.month).toLowerCase();
      const moneyBits = [
        formatMoney(r.income, currencyCode),
        formatMoney(r.billsTotal + r.totalPaydayOutflow, currencyCode),
        formatMoney(r.cushionAfterBills, currencyCode),
      ]
        .join(" ")
        .toLowerCase();
      return (
        monthLabel.includes(query) ||
        short.includes(query) ||
        moneyBits.includes(query)
      );
    });
  }, [currencyCode, query, rollups]);

  const onClearMonth = (item: MonthRollup) => {
    if (item.lines.length === 0) {
      Alert.alert("Nothing to clear", "This month has no payday outflows.");
      return;
    }
    Alert.alert(
      "Clear month outflows?",
      `Remove ${item.lines.length} payday outflow${item.lines.length === 1 ? "" : "s"} from ${formatMonthIdShort(item.month)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            for (const line of item.lines) {
              deleteLine(line.id);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: MonthRollup }) => {
    const positive = item.cushionAfterBills >= 0;
    const accent = positive ? palette.success : palette.danger;
    const out = item.billsTotal + item.totalPaydayOutflow;

    return (
      <RNView
        style={[
          styles.row,
          {
            borderBottomColor: palette.border,
          },
        ]}
      >
        <RNView style={[styles.accentBar, { backgroundColor: accent }]} />
        <RNView style={styles.rowMain}>
          <Text style={[styles.monthLabel, { color: palette.text }]}>
            {formatMonthIdShort(item.month)}
          </Text>
          <RNView style={styles.flowRow}>
            <MoneyText
              amount={item.income}
              variant="compact"
              style={{ color: palette.textMuted, fontSize: 13 }}
            />
            <Text style={[styles.flowSep, { color: palette.textMuted }]}>
              {" "}
              in ·{" "}
            </Text>
            <MoneyText
              amount={out}
              variant="compact"
              style={{ color: palette.textMuted, fontSize: 13 }}
            />
            <Text style={[styles.flowSep, { color: palette.textMuted }]}>
              {" "}
              out
            </Text>
          </RNView>
        </RNView>
        <RNView style={styles.rowRight}>
          <MoneyText
            amount={item.cushionAfterBills}
            variant="compactEmphasis"
            signed
            style={{ color: accent }}
          />
          <Text style={[styles.statusLabel, { color: accent }]}>
            {positive ? "cushion" : "deficit"}
          </Text>
        </RNView>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Clear outflows for ${formatMonthIdShort(item.month)}`}
          onPress={() => onClearMonth(item)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.clearBtn,
            {
              backgroundColor: pressed
                ? palette.dangerMuted
                : palette.surfaceMuted,
            },
          ]}
        >
          <FontAwesome name="times" size={12} color={palette.danger} />
        </Pressable>
      </RNView>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <FlatList
        data={filteredRollups}
        keyExtractor={(r) => r.month}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          filteredRollups.length === 0 && styles.listEmpty,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: Math.max(40, tabBarHeight + spacing.md),
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <RNView style={styles.headerBlock}>
            <RNView style={styles.titleRow}>
              <BrandMark size={28} />
              <RNView style={styles.titleCol}>
                <Text style={[styles.title, { color: palette.text }]}>
                  Timeline
                </Text>
                <Text style={[styles.subtitle, { color: palette.textMuted }]}>
                  Your payday history
                </Text>
              </RNView>
            </RNView>
            <RNView
              style={[
                styles.searchWrap,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
                cardElevation(colorScheme),
              ]}
            >
              <FontAwesome
                name="search"
                size={14}
                color={palette.textMuted}
                style={styles.searchIcon}
              />
              <FluxTextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search months..."
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: "transparent",
                    borderColor: "transparent",
                  },
                ]}
              />
            </RNView>
          </RNView>
        }
        ListEmptyComponent={
          <RNView
            style={[
              styles.emptyCard,
              { backgroundColor: palette.surface },
              cardElevation(colorScheme),
            ]}
          >
            <Text style={[styles.empty, { color: palette.textMuted }]}>
              No payday months yet. Add income and bills in Plan — months will
              show up here.
            </Text>
          </RNView>
        }
        style={styles.listSurface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  listEmpty: {
    flexGrow: 1,
  },
  listSurface: {
    backgroundColor: "transparent",
  },
  headerBlock: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: spacing.md,
    overflow: "hidden",
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 72,
    paddingVertical: spacing.md,
    paddingRight: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: "transparent",
  },
  accentBar: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 2,
    marginVertical: 4,
  },
  rowMain: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  monthLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
  flowRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
  },
  flowSep: {
    fontSize: 13,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
  },
});
