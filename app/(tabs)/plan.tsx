import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  View as RNView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BillsBottomSheet } from "@/components/BillsBottomSheet";
import { BrandMark } from "@/components/BrandMark";
import { IncomeStreamBottomSheet } from "@/components/IncomeStreamBottomSheet";
import { MoneyText } from "@/components/MoneyText";
import { MonthPickerField } from "@/components/MonthPickerField";
import { QuickAddLineSheet } from "@/components/QuickAddLineSheet";
import { ReceiptScanSheet } from "@/components/ReceiptScanSheet";
import { Text } from "@/components/Themed";
import {
  DangerOutlineButton,
  FluxTextInput,
  FormField,
  PrimaryButton,
  ScreenScroll,
  useFluxPalette,
} from "@/components/ui";
import { cardElevation, radii, spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import {
  compareMonthId,
  currentPaydayMonthId,
  type MonthId,
} from "@/src/domain/month";
import { logActivity } from "@/src/lib/activityLog";
import {
  formatMoney,
  parseMoneyInput,
  sampleMoneyPlaceholder,
} from "@/src/lib/formatCurrency";
import type { CurrencyCode } from "@/src/lib/currencies";
import { useBudgetStore } from "@/src/state/budgetStore";
import { useCurrencyStore } from "@/src/state/currencyStore";

function moneyDraftFromText(text: string, code: CurrencyCode) {
  if (!text.replaceAll(/\D/g, "")) return "";
  return formatMoney(parseMoneyInput(text), code);
}

export default function PlanScreen() {
  const { palette, colorScheme } = useFluxPalette();
  const insets = useSafeAreaInsets();
  const currencyCode = useCurrencyStore((s) => s.currencyCode);

  const incomeStreams = useBudgetStore((s) => s.incomeStreams);
  const billItems = useBudgetStore((s) => s.billItems);
  const lines = useBudgetStore((s) => s.lines);

  const addIncomeStream = useBudgetStore((s) => s.addIncomeStream);
  const removeIncomeStream = useBudgetStore((s) => s.removeIncomeStream);
  const deleteBill = useBudgetStore((s) => s.deleteBill);
  const addLine = useBudgetStore((s) => s.addLine);
  const deleteLine = useBudgetStore((s) => s.deleteLine);
  const resetBudget = useBudgetStore((s) => s.resetBudget);

  const [billsOpen, setBillsOpen] = useState(false);
  const [receiptScanOpen, setReceiptScanOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [showOutflowForm, setShowOutflowForm] = useState(false);
  const [incomeStreamSheetId, setIncomeStreamSheetId] = useState<string | null>(
    null,
  );

  const [addMonth, setAddMonth] = useState<MonthId>(() =>
    currentPaydayMonthId(),
  );
  const [addEndMonth, setAddEndMonth] = useState<MonthId>(() =>
    currentPaydayMonthId(),
  );
  const [addLineRecurrence, setAddLineRecurrence] = useState<
    "one_time" | "monthly"
  >("one_time");
  const [addLabel, setAddLabel] = useState("");
  const [addAmount, setAddAmount] = useState("");

  const paydayMonth = currentPaydayMonthId();
  const monthLines = useMemo(
    () =>
      lines.filter((line) => {
        if (line.recurrence === "monthly") {
          const start = line.startMonth ?? line.month;
          const end = line.endMonth ?? line.month;
          return paydayMonth >= start && paydayMonth <= end;
        }
        return line.month === paydayMonth;
      }),
    [lines, paydayMonth],
  );

  const monthTriggerStyle = useMemo(
    () => ({
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radii.md,
      borderColor: palette.borderStrong,
      backgroundColor: palette.surfaceMuted,
    }),
    [palette.borderStrong, palette.surfaceMuted],
  );

  const onAddIncomeRow = () => {
    const id = `income-${Date.now().toString(36)}`;
    addIncomeStream({ id, label: "", amountNgn: 0 });
    setIncomeStreamSheetId(id);
  };

  const onAddBill = () => setBillsOpen(true);

  const onAddOutflow = () => {
    setShowOutflowForm(true);
    setQuickAddOpen(true);
  };

  const onAddLine = () => {
    const amount = parseMoneyInput(addAmount || "0");
    if (amount <= 0) {
      Alert.alert("Amount needed", "Enter a positive amount.");
      return;
    }
    const label = addLabel.trim() || "Payday item";
    if (
      addLineRecurrence === "monthly" &&
      compareMonthId(addEndMonth, addMonth) < 0
    ) {
      Alert.alert(
        "End month needed",
        "End month cannot be earlier than start month.",
      );
      return;
    }
    addLine({
      month: addMonth,
      label,
      amount,
      recurrence: addLineRecurrence,
      ...(addLineRecurrence === "monthly"
        ? { startMonth: addMonth, endMonth: addEndMonth }
        : {}),
    });
    setAddLabel("");
    setAddAmount("");
    setShowOutflowForm(false);
    logActivity(
      "add-line",
      `${label} · ${formatMoney(amount, currencyCode)}`,
    ).catch(() => {});
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
          onPress: () => {
            resetBudget();
            setAddMonth(currentPaydayMonthId());
            setAddEndMonth(currentPaydayMonthId());
            setAddLineRecurrence("one_time");
            setAddLabel("");
            setAddAmount("");
          },
        },
      ],
    );
  };

  return (
    <>
      <ScreenScroll>
        <RNView style={{ height: insets.top }} />
        <RNView style={styles.titleRow}>
          <BrandMark size={28} />
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
          palette={palette}
        >
          <RNView
            style={[
              styles.card,
              { backgroundColor: palette.surface },
              cardElevation(colorScheme),
            ]}
          >
            {incomeStreams.length === 0 ? (
              <Text style={[styles.empty, { color: palette.textMuted }]}>
                No income streams yet.
              </Text>
            ) : (
              incomeStreams.map((stream, idx) => (
                <Pressable
                  key={stream.id}
                  accessibilityRole="button"
                  onPress={() => setIncomeStreamSheetId(stream.id)}
                  style={({ pressed }) => [
                    styles.itemRow,
                    idx < incomeStreams.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: palette.border,
                    },
                    { opacity: pressed ? 0.92 : 1 },
                  ]}
                >
                  <RNView
                    style={[
                      styles.dot,
                      { backgroundColor: palette.accentIncome },
                    ]}
                  />
                  <Text
                    style={[styles.itemLabel, { color: palette.text }]}
                    numberOfLines={1}
                  >
                    {stream.label.trim() || "Untitled"}
                  </Text>
                  <MoneyText
                    amount={stream.amountNgn}
                    style={{ color: palette.text }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${stream.label || "income"}`}
                    hitSlop={8}
                    onPress={() => removeIncomeStream(stream.id)}
                  >
                    <FontAwesome
                      name="times"
                      size={14}
                      color={palette.textMuted}
                    />
                  </Pressable>
                </Pressable>
              ))
            )}
          </RNView>
        </PlanSection>

        <PlanSection
          title="RECURRING BILLS"
          onAdd={onAddBill}
          palette={palette}
        >
          <RNView
            style={[
              styles.card,
              { backgroundColor: palette.surface },
              cardElevation(colorScheme),
            ]}
          >
            {billItems.length === 0 ? (
              <Text style={[styles.empty, { color: palette.textMuted }]}>
                No bills yet.
              </Text>
            ) : (
              billItems.map((bill, idx) => (
                <RNView
                  key={bill.id}
                  style={[
                    styles.itemRow,
                    idx < billItems.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: palette.border,
                    },
                  ]}
                >
                  <RNView
                    style={[
                      styles.dot,
                      { backgroundColor: palette.accentBills },
                    ]}
                  />
                  <Text
                    style={[styles.itemLabel, { color: palette.text }]}
                    numberOfLines={1}
                  >
                    {bill.label.trim() || "Bill"}
                  </Text>
                  <MoneyText
                    amount={bill.amount}
                    style={{ color: palette.text }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${bill.label || "bill"}`}
                    hitSlop={8}
                    onPress={() => deleteBill(bill.id)}
                  >
                    <FontAwesome
                      name="times"
                      size={14}
                      color={palette.textMuted}
                    />
                  </Pressable>
                </RNView>
              ))
            )}
          </RNView>
          <Pressable
            accessibilityRole="button"
            onPress={() => setBillsOpen(true)}
            style={({ pressed }) => [
              styles.manageLink,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={{ color: palette.tint, fontWeight: "600" }}>
              Manage bills
            </Text>
          </Pressable>
        </PlanSection>

        <PlanSection
          title="PAYDAY OUTFLOWS"
          onAdd={onAddOutflow}
          palette={palette}
        >
          <RNView
            style={[
              styles.card,
              { backgroundColor: palette.surface },
              cardElevation(colorScheme),
            ]}
          >
            {monthLines.length === 0 ? (
              <Text style={[styles.empty, { color: palette.textMuted }]}>
                No payday outflows this month.
              </Text>
            ) : (
              monthLines.map((line, idx) => (
                <RNView
                  key={line.id}
                  style={[
                    styles.itemRow,
                    idx < monthLines.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: palette.border,
                    },
                  ]}
                >
                  <RNView
                    style={[
                      styles.dot,
                      { backgroundColor: palette.accentOutflow },
                    ]}
                  />
                  <Text
                    style={[styles.itemLabel, { color: palette.text }]}
                    numberOfLines={1}
                  >
                    {line.label.trim() || "Outflow"}
                  </Text>
                  <MoneyText
                    amount={line.amount}
                    style={{ color: palette.text }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${line.label || "outflow"}`}
                    hitSlop={8}
                    onPress={() => deleteLine(line.id)}
                  >
                    <FontAwesome
                      name="times"
                      size={14}
                      color={palette.textMuted}
                    />
                  </Pressable>
                </RNView>
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
              opacity: pressed ? 0.92 : 1,
            },
            cardElevation(colorScheme),
          ]}
        >
          <FontAwesome name="camera" size={16} color={palette.tint} />
          <Text style={[styles.scanText, { color: palette.text }]}>
            Scan receipt
          </Text>
          <FontAwesome
            name="chevron-right"
            size={14}
            color={palette.textMuted}
          />
        </Pressable>

        {showOutflowForm ? (
          <RNView
            style={[
              styles.formCard,
              { backgroundColor: palette.surface },
              cardElevation(colorScheme),
            ]}
          >
            <Text style={[styles.formTitle, { color: palette.text }]}>
              Add payday outflow
            </Text>
            <FormField label="When this applies">
              <RNView style={styles.recurRow}>
                {(
                  [
                    ["one_time", "One-time"],
                    ["monthly", "Monthly"],
                  ] as const
                ).map(([value, label]) => {
                  const selected = addLineRecurrence === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setAddLineRecurrence(value)}
                      style={[
                        styles.recurChip,
                        {
                          borderColor: selected ? palette.tint : palette.border,
                          backgroundColor: selected
                            ? palette.tintMuted
                            : palette.surfaceMuted,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: selected
                            ? palette.tintStrong
                            : palette.textSecondary,
                          fontWeight: "700",
                        }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </RNView>
            </FormField>
            {addLineRecurrence === "monthly" ? (
              <RNView style={styles.rangeRow}>
                <RNView style={styles.rangeCol}>
                  <Text style={[styles.rangeLabel, { color: palette.textMuted }]}>
                    Start
                  </Text>
                  <MonthPickerField
                    value={addMonth}
                    onChange={(m) => {
                      setAddMonth(m);
                      if (compareMonthId(addEndMonth, m) < 0) setAddEndMonth(m);
                    }}
                    palette={palette}
                    triggerStyle={monthTriggerStyle}
                  />
                </RNView>
                <RNView style={styles.rangeCol}>
                  <Text style={[styles.rangeLabel, { color: palette.textMuted }]}>
                    End
                  </Text>
                  <MonthPickerField
                    value={addEndMonth}
                    onChange={setAddEndMonth}
                    palette={palette}
                    triggerStyle={monthTriggerStyle}
                  />
                </RNView>
              </RNView>
            ) : (
              <FormField label="Month">
                <MonthPickerField
                  value={addMonth}
                  onChange={setAddMonth}
                  palette={palette}
                  triggerStyle={monthTriggerStyle}
                />
              </FormField>
            )}
            <FormField label="Label">
              <FluxTextInput
                value={addLabel}
                onChangeText={setAddLabel}
                placeholder="e.g. Family support"
              />
            </FormField>
            <FormField label="Amount">
              <FluxTextInput
                value={addAmount}
                onChangeText={(t) =>
                  setAddAmount(moneyDraftFromText(t, currencyCode))
                }
                keyboardType="number-pad"
                money
                placeholder={`e.g. ${sampleMoneyPlaceholder(30000)}`}
              />
            </FormField>
            <PrimaryButton label="Add item" onPress={onAddLine} />
          </RNView>
        ) : null}

        <DangerOutlineButton label="Start over" onPress={onStartOver} />
      </ScreenScroll>

      <BillsBottomSheet
        visible={billsOpen}
        onClose={() => setBillsOpen(false)}
      />
      <ReceiptScanSheet
        visible={receiptScanOpen}
        onClose={() => setReceiptScanOpen(false)}
        month={addMonth}
        onMonthChange={setAddMonth}
      />
      <IncomeStreamBottomSheet
        streamId={incomeStreamSheetId}
        onClose={() => setIncomeStreamSheetId(null)}
      />
      <QuickAddLineSheet
        visible={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        initialMonth={paydayMonth}
      />
    </>
  );
}

function PlanSection({
  title,
  onAdd,
  children,
  palette,
}: Readonly<{
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
  palette: ReturnType<typeof useFluxPalette>["palette"];
}>) {
  return (
    <RNView style={styles.section}>
      <RNView style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onAdd}
          style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
        >
          <Text style={[styles.addBtn, { color: palette.tint }]}>+ Add</Text>
        </Pressable>
      </RNView>
      {children}
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
  section: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
  addBtn: {
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  empty: {
    padding: spacing.lg,
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  manageLink: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
  },
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  scanText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  formCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  recurRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  recurChip: {
    flex: 1,
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rangeCol: {
    flex: 1,
    gap: 6,
  },
  rangeLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
