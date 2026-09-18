import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  View as RNView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BillsBottomSheet } from "@/components/BillsBottomSheet";
import { IncomeStreamBottomSheet } from "@/components/IncomeStreamBottomSheet";
import { MoneyText } from "@/components/MoneyText";
import { MonthPickerField } from "@/components/MonthPickerField";
import { QuickAddLineSheet } from "@/components/QuickAddLineSheet";
import { ReceiptScanSheet } from "@/components/ReceiptScanSheet";
import { StatementImportSheet } from "@/components/StatementImportSheet";
import { Text } from "@/components/Themed";
import { TourTarget } from "@/components/TourTarget";
import {
  DangerOutlineButton,
  ScreenScroll,
  useFluxPalette,
} from "@/components/ui";
import { radii, spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import {
  compareMonthId,
  currentPaydayMonthId,
  formatMonthIdShort,
  monthsInclusiveCount,
  type MonthId,
} from "@/src/domain/month";
import type { PaydayLine } from "@/src/domain/types";
import type { TourTargetId } from "@/src/lib/tourSteps";
import { useBudgetStore } from "@/src/state/budgetStore";

const CARD_BORDER = "#E0DAD3";
const ADD_GREEN = "#48B872";

const brandLogo = require("../../assets/images/icon.png");

export default function PlanScreen() {
  const { palette, colorScheme } = useFluxPalette();
  const insets = useSafeAreaInsets();
  const dark = colorScheme === "dark";
  const borderColor = dark ? palette.cardBorder : CARD_BORDER;

  const incomeStreams = useBudgetStore((s) => s.incomeStreams);
  const billItems = useBudgetStore((s) => s.billItems);
  const lines = useBudgetStore((s) => s.lines);

  const addIncomeStream = useBudgetStore((s) => s.addIncomeStream);
  const removeIncomeStream = useBudgetStore((s) => s.removeIncomeStream);
  const deleteBill = useBudgetStore((s) => s.deleteBill);
  const deleteLine = useBudgetStore((s) => s.deleteLine);
  const resetBudget = useBudgetStore((s) => s.resetBudget);

  const [billsOpen, setBillsOpen] = useState(false);
  const [receiptScanOpen, setReceiptScanOpen] = useState(false);
  const [statementImportOpen, setStatementImportOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [incomeStreamSheetId, setIncomeStreamSheetId] = useState<string | null>(
    null,
  );
  const [viewMonth, setViewMonth] = useState<MonthId>(() =>
    currentPaydayMonthId(),
  );

  const monthLines = useMemo(
    () =>
      lines.filter((line) => {
        if (line.recurrence === "monthly") {
          const start = line.startMonth ?? line.month;
          const end = line.endMonth ?? start;
          return (
            compareMonthId(viewMonth, start) >= 0 &&
            compareMonthId(viewMonth, end) <= 0
          );
        }
        return line.month === viewMonth;
      }),
    [lines, viewMonth],
  );

  const onAddIncomeRow = () => {
    const id = `income-${Date.now().toString(36)}`;
    addIncomeStream({ id, label: "", amountNgn: 0 });
    setIncomeStreamSheetId(id);
  };

  const onStartOver = () => {
    Alert.alert(
      "Start over?",
      "This clears income streams, payday outflows, and bills.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start over",
          style: "destructive",
          onPress: () => resetBudget(),
        },
      ],
    );
  };

  return (
    <>
      <ScreenScroll>
        <RNView style={{ height: insets.top }} />
        <RNView style={styles.titleRow}>
          <Image source={brandLogo} style={styles.brandLogo} />
          <RNView style={styles.titleCol}>
            <Text style={[styles.title, { color: palette.text }]}>Plan</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              Income streams, bills & outflows
            </Text>
          </RNView>
        </RNView>

        <PlanSection
          title="INCOME STREAMS"
          onAdd={onAddIncomeRow}
          labelColor={palette.textMuted}
          dark={dark}
          addTourId="plan-add-income"
        >
          <RNView
            style={[
              styles.card,
              {
                backgroundColor: palette.surface,
                borderColor,
              },
            ]}
          >
            {incomeStreams.length === 0 ? (
              <Text style={[styles.empty, { color: palette.textMuted }]}>
                No income streams yet.
              </Text>
            ) : (
              incomeStreams.map((stream, idx) => (
                <PlanRow
                  key={stream.id}
                  label={stream.label.trim() || "Untitled"}
                  amount={stream.amountNgn}
                  dotColor={ADD_GREEN}
                  textColor={dark ? "#EDE8E0" : "#1C1814"}
                  amountColor={dark ? "#B0A89E" : "#5A5349"}
                  borderColor={borderColor}
                  showDivider={idx < incomeStreams.length - 1}
                  onPress={() => setIncomeStreamSheetId(stream.id)}
                  onRemove={() => removeIncomeStream(stream.id)}
                  removeLabel={`Remove ${stream.label || "income"}`}
                  mutedIcon={palette.textMuted}
                />
              ))
            )}
          </RNView>
        </PlanSection>

        <PlanSection
          title="RECURRING BILLS"
          onAdd={() => setBillsOpen(true)}
          labelColor={palette.textMuted}
          dark={dark}
          addTourId="plan-add-bill"
        >
          <RNView
            style={[
              styles.card,
              {
                backgroundColor: palette.surface,
                borderColor,
              },
            ]}
          >
            {billItems.length === 0 ? (
              <Text style={[styles.empty, { color: palette.textMuted }]}>
                No bills yet.
              </Text>
            ) : (
              billItems.map((bill, idx) => (
                <PlanRow
                  key={bill.id}
                  label={bill.label.trim() || "Bill"}
                  amount={bill.amount}
                  dotColor={palette.accentBills}
                  textColor={dark ? "#EDE8E0" : "#1C1814"}
                  amountColor={dark ? "#B0A89E" : "#5A5349"}
                  borderColor={borderColor}
                  showDivider={idx < billItems.length - 1}
                  onPress={() => setBillsOpen(true)}
                  onRemove={() => deleteBill(bill.id)}
                  removeLabel={`Remove ${bill.label || "bill"}`}
                  mutedIcon={palette.textMuted}
                />
              ))
            )}
          </RNView>
        </PlanSection>

        <PlanSection
          title="PAYDAY OUTFLOWS"
          onAdd={() => setQuickAddOpen(true)}
          labelColor={palette.textMuted}
          dark={dark}
        >
          <MonthPickerField
            value={viewMonth}
            onChange={setViewMonth}
            palette={palette}
            triggerStyle={[
              styles.monthTrigger,
              {
                borderColor,
                backgroundColor: palette.surface,
              },
            ]}
          />
          <RNView
            style={[
              styles.card,
              {
                backgroundColor: palette.surface,
                borderColor,
              },
            ]}
          >
            {monthLines.length === 0 ? (
              <Text style={[styles.empty, { color: palette.textMuted }]}>
                No payday outflows for {formatMonthIdShort(viewMonth)}.
              </Text>
            ) : (
              monthLines.map((line, idx) => (
                <PlanRow
                  key={line.id}
                  label={line.label.trim() || "Outflow"}
                  subtitle={outflowSubtitle(line)}
                  amount={line.amount}
                  dotColor={palette.accentOutflow}
                  textColor={dark ? "#EDE8E0" : "#1C1814"}
                  amountColor={dark ? "#B0A89E" : "#5A5349"}
                  borderColor={borderColor}
                  showDivider={idx < monthLines.length - 1}
                  onRemove={() => deleteLine(line.id)}
                  removeLabel={`Remove ${line.label || "outflow"}`}
                  mutedIcon={palette.textMuted}
                />
              ))
            )}
          </RNView>
        </PlanSection>

        <Pressable
          accessibilityRole="button"
          onPress={() => setReceiptScanOpen(true)}
          style={({ pressed }) => [
            styles.scanRow,
            {
              backgroundColor: palette.surface,
              borderColor,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <FontAwesome name="camera" size={16} color={ADD_GREEN} />
          <Text style={[styles.scanText, { color: palette.text }]}>
            Scan receipt
          </Text>
          <FontAwesome
            name="chevron-right"
            size={14}
            color={palette.textMuted}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setStatementImportOpen(true)}
          style={({ pressed }) => [
            styles.scanRow,
            {
              backgroundColor: palette.surface,
              borderColor,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <FontAwesome name="file-text-o" size={16} color={ADD_GREEN} />
          <RNView style={styles.scanTextCol}>
            <Text style={[styles.scanText, { color: palette.text }]}>
              Import bank statement
            </Text>
            <Text style={[styles.scanSub, { color: palette.textMuted }]}>
              Auto-fill bills from a PDF or CSV — parsed on-device
            </Text>
          </RNView>
          <FontAwesome
            name="chevron-right"
            size={14}
            color={palette.textMuted}
          />
        </Pressable>

        <DangerOutlineButton label="Start over" onPress={onStartOver} />
      </ScreenScroll>

      <BillsBottomSheet
        visible={billsOpen}
        onClose={() => setBillsOpen(false)}
      />
      <StatementImportSheet
        visible={statementImportOpen}
        onClose={() => setStatementImportOpen(false)}
      />
      <ReceiptScanSheet
        visible={receiptScanOpen}
        onClose={() => setReceiptScanOpen(false)}
        month={viewMonth}
        onMonthChange={setViewMonth}
      />
      <IncomeStreamBottomSheet
        streamId={incomeStreamSheetId}
        onClose={() => setIncomeStreamSheetId(null)}
      />
      <QuickAddLineSheet
        visible={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        initialMonth={viewMonth}
        onAdded={setViewMonth}
      />
    </>
  );
}

function outflowSubtitle(line: PaydayLine): string | undefined {
  if (line.recurrence !== "monthly") return undefined;
  const start = line.startMonth ?? line.month;
  const end = line.endMonth ?? start;
  const count = monthsInclusiveCount(start, end);
  return `Monthly · ${count} mo · ${formatMonthIdShort(start)}–${formatMonthIdShort(end)}`;
}

function PlanSection({
  title,
  onAdd,
  children,
  labelColor,
  dark,
  addTourId,
}: Readonly<{
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
  labelColor: string;
  dark: boolean;
  addTourId?: TourTargetId;
}>) {
  const addButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add to ${title}`}
      onPress={onAdd}
      style={({ pressed }) => [
        styles.addBtn,
        dark && styles.addBtnDark,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={styles.addBtnText}>+ Add</Text>
    </Pressable>
  );

  return (
    <RNView style={styles.section}>
      <RNView style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: labelColor }]}>
          {title}
        </Text>
        {addTourId ? (
          <TourTarget id={addTourId}>{addButton}</TourTarget>
        ) : (
          addButton
        )}
      </RNView>
      {children}
    </RNView>
  );
}

function PlanRow({
  label,
  subtitle,
  amount,
  dotColor,
  textColor,
  amountColor,
  borderColor,
  showDivider,
  onPress,
  onRemove,
  removeLabel,
  mutedIcon,
}: Readonly<{
  label: string;
  subtitle?: string;
  amount: number;
  dotColor: string;
  textColor: string;
  amountColor: string;
  borderColor: string;
  showDivider: boolean;
  onPress?: () => void;
  onRemove: () => void;
  removeLabel: string;
  mutedIcon: string;
}>) {
  const body = (
    <>
      <RNView style={[styles.dot, { backgroundColor: dotColor }]} />
      <RNView style={styles.itemTextCol}>
        <Text
          style={[styles.itemLabel, { color: textColor }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.itemSub, { color: mutedIcon }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </RNView>
      <MoneyText amount={amount} style={{ color: amountColor, fontSize: 14 }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
        hitSlop={8}
        onPress={(e) => {
          e.stopPropagation?.();
          onRemove();
        }}
      >
        <FontAwesome name="times" size={14} color={mutedIcon} />
      </Pressable>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.itemRow,
          showDivider && {
            borderBottomWidth: 1,
            borderBottomColor: borderColor,
          },
          { opacity: pressed ? 0.92 : 1 },
        ]}
      >
        {body}
      </Pressable>
    );
  }

  return (
    <RNView
      style={[
        styles.itemRow,
        showDivider && {
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        },
      ]}
    >
      {body}
    </RNView>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
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
  section: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  monthTrigger: {
    borderWidth: 1,
    borderRadius: radii.md,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: typeface.bold,
    fontSize: 11,
    letterSpacing: 1,
  },
  addBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  addBtnDark: {
    backgroundColor: "#1E3328",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addBtnText: {
    color: ADD_GREEN,
    fontFamily: typeface.bold,
    fontSize: 14,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  empty: {
    padding: spacing.lg,
    fontFamily: typeface.regular,
    fontSize: 14,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  itemTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemLabel: {
    fontFamily: typeface.regular,
    fontSize: 14,
  },
  itemSub: {
    fontFamily: typeface.regular,
    fontSize: 12,
  },
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  scanText: {
    flex: 1,
    fontFamily: typeface.medium,
    fontSize: 15,
  },
  scanTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  scanSub: {
    fontFamily: typeface.regular,
    fontSize: 12,
  },
});
