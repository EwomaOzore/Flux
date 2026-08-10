import { MoneyText } from "@/components/MoneyText";
import { Text, View } from "@/components/Themed";
import { FluxTextInput } from "@/components/ui";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import { formatMonthIdDisplay, formatMonthIdShort } from "@/src/domain/month";
import type { MonthRollup } from "@/src/domain/types";
import { formatMoney } from "@/src/lib/formatCurrency";
import { computeRollups, useBudgetStore } from "@/src/state/budgetStore";
import { useCurrencyStore } from "@/src/state/currencyStore";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  View as RNView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";

const CARD_BORDER = "#E0DAD3";

const brandLogo = require("../../assets/images/icon.png");

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

  const borderColor = colorScheme === "dark" ? palette.cardBorder : CARD_BORDER;

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

  const renderItem = ({
    item,
    index,
  }: {
    item: MonthRollup;
    index: number;
  }) => {
    const positive = item.cushionAfterBills >= 0;
    const accent = positive ? palette.success : palette.danger;
    const out = item.billsTotal + item.totalPaydayOutflow;
    const isLast = index === filteredRollups.length - 1;

    return (
      <RNView
        style={[
          styles.row,
          !isLast && {
            borderBottomWidth: 1,
            borderBottomColor: borderColor,
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
              variant="stat"
              style={styles.flowAmount}
            />
            <Text style={[styles.flowSep, { color: palette.textMuted }]}>
              {" "}
              in ·{" "}
            </Text>
            <MoneyText amount={out} variant="stat" style={styles.flowAmount} />
            <Text style={[styles.flowSep, { color: palette.textMuted }]}>
              {" "}
              out
            </Text>
          </RNView>
        </RNView>
        <RNView style={styles.rowRight}>
          <MoneyText
            amount={item.cushionAfterBills}
            variant="stat"
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
              backgroundColor: palette.dangerMuted,
              borderColor,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <FontAwesome name="times" size={11} color={palette.danger} />
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
              <Image source={brandLogo} style={styles.brandLogo} />
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
                  borderColor,
                },
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
                placeholderTextColor={palette.textMuted}
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: "transparent",
                    borderColor: "transparent",
                    color: palette.text,
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
              {
                backgroundColor: palette.surface,
                borderColor,
              },
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    borderWidth: 1,
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
    fontFamily: typeface.regular,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 72,
    paddingVertical: spacing.md,
    paddingRight: spacing.xs,
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
    fontFamily: typeface.bold,
    fontSize: 16,
  },
  flowRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
  },
  flowAmount: {
    color: "#9A9188",
    fontSize: 13,
    lineHeight: 18,
  },
  flowSep: {
    fontFamily: typeface.regular,
    fontSize: 13,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  statusLabel: {
    fontFamily: typeface.regular,
    fontSize: 12,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  empty: {
    fontFamily: typeface.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  brandLogo: {
    width: 24,
    height: 24,
  },
});
