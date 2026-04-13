import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  View as RNView,
  Share,
  StyleSheet,
  Switch,
} from "react-native";

import { BillsBottomSheet } from "@/components/BillsBottomSheet";
import { IncomeStreamBottomSheet } from "@/components/IncomeStreamBottomSheet";
import { MonthPickerField } from "@/components/MonthPickerField";
import { ReceiptScanSheet } from "@/components/ReceiptScanSheet";
import { Text } from "@/components/Themed";
import {
  DangerOutlineButton,
  FluxTextInput,
  FormField,
  PrimaryButton,
  ScreenScroll,
  SectionCard,
  useFluxPalette,
} from "@/components/ui";
import { hairlineBorder, radii, spacing } from "@/constants/theme";
import {
  currentPaydayMonthId,
  formatMonthIdDisplay,
  type MonthId,
} from "@/src/domain/month";
import { incomeNgnForMonth, totalBillsAmount } from "@/src/domain/types";
import { buildExportCsv, buildExportJson } from "@/src/lib/exportBudget";
import { formatNgn, parseNgnInput } from "@/src/lib/formatCurrency";
import {
  applyReminderPrefs,
  defaultReminderPrefs,
  loadReminderPrefs,
  type ReminderPrefs,
} from "@/src/lib/paydayReminders";
import { useBudgetStore } from "@/src/state/budgetStore";

function moneyDraftFromText(text: string): string {
  if (!text.replace(/\D/g, "")) return "";
  return formatNgn(parseNgnInput(text));
}

export default function PlanScreen() {
  const { palette } = useFluxPalette();

  const incomeStreams = useBudgetStore((s) => s.incomeStreams);
  const billItems = useBudgetStore((s) => s.billItems);

  const addIncomeStream = useBudgetStore((s) => s.addIncomeStream);
  const addLine = useBudgetStore((s) => s.addLine);
  const resetBudget = useBudgetStore((s) => s.resetBudget);

  const [billsOpen, setBillsOpen] = useState(false);
  const [receiptScanOpen, setReceiptScanOpen] = useState(false);
  const [incomeStreamSheetId, setIncomeStreamSheetId] = useState<string | null>(
    null,
  );

  const [addMonth, setAddMonth] = useState<MonthId>(() =>
    currentPaydayMonthId(),
  );
  const [addLabel, setAddLabel] = useState("");
  const [addAmount, setAddAmount] = useState("");

  const [reminderPrefs, setReminderPrefs] =
    useState<ReminderPrefs>(defaultReminderPrefs);

  const billsSum = useMemo(() => totalBillsAmount(billItems), [billItems]);
  const incomeSum = useMemo(
    () => incomeNgnForMonth(incomeStreams, currentPaydayMonthId()),
    [incomeStreams],
  );

  useEffect(() => {
    const load = () => {
      void loadReminderPrefs().then(setReminderPrefs);
    };
    if (useBudgetStore.persist.hasHydrated()) {
      load();
    }
    return useBudgetStore.persist.onFinishHydration(load);
  }, []);

  const monthTriggerStyle = useMemo(
    () => ({
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radii.md,
      borderColor: palette.borderStrong,
      backgroundColor: palette.surfaceMuted,
    }),
    [palette.borderStrong, palette.surfaceMuted],
  );

  const exportPayload = () => ({
    incomeStreams: useBudgetStore.getState().incomeStreams,
    billItems: useBudgetStore.getState().billItems,
    lines: useBudgetStore.getState().lines,
  });

  const onExportJson = async () => {
    const json = buildExportJson(exportPayload());
    try {
      await Share.share({
        message: json,
        title: "Flux backup (JSON)",
      });
    } catch {
      Alert.alert("Could not share", "Try again or copy from a file manager.");
    }
  };

  const onExportCsv = async () => {
    const csv = buildExportCsv(exportPayload());
    try {
      await Share.share({
        message: csv,
        title: "Flux backup (CSV)",
      });
    } catch {
      Alert.alert("Could not share", "Try again or copy from a file manager.");
    }
  };

  const onReminderToggle = async (enabled: boolean) => {
    const next = { ...reminderPrefs, enabled };
    setReminderPrefs(next);
    const ok = await applyReminderPrefs(next);
    if (enabled && !ok) {
      setReminderPrefs((p) => ({ ...p, enabled: false }));
      Alert.alert(
        "Notifications off",
        "Allow notifications for Flux in system settings to get payday reminders.",
      );
    }
  };

  const onReminderEveToggle = async (alsoRemindEve: boolean) => {
    const next = { ...reminderPrefs, alsoRemindEve };
    setReminderPrefs(next);
    await applyReminderPrefs(next);
  };

  const onAddIncomeRow = () => {
    const id = `income-${Date.now().toString(36)}`;
    addIncomeStream({ id, label: "", amountNgn: 0 });
    setIncomeStreamSheetId(id);
  };

  const onAddLine = () => {
    const amount = parseNgnInput(addAmount || "0");
    if (amount <= 0) {
      Alert.alert("Amount needed", "Enter a positive amount.");
      return;
    }
    const label = addLabel.trim() || "Payday item";
    addLine({ month: addMonth, label, amount });
    setAddLabel("");
    setAddAmount("");
    Alert.alert(
      "Added",
      `“${label}” for ${formatMonthIdDisplay(addMonth)} was added. It will show on Home and Timeline.`,
    );
  };

  const onStartOver = () => {
    Alert.alert(
      "Start over?",
      "This clears income streams, payday outflows, bills, and reminders stay unless you turn them off.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start over",
          style: "destructive",
          onPress: () => {
            resetBudget();
            setAddMonth(currentPaydayMonthId());
            setAddLabel("");
            setAddAmount("");
          },
        },
      ],
    );
  };

  const billsSummary =
    billItems.length === 0
      ? "Tap to add rent, utilities, subscriptions…"
      : `${billItems.length} ${billItems.length === 1 ? "item" : "items"} · ${formatNgn(billsSum)}`;

  return (
    <>
      <ScreenScroll>
        <RNView style={styles.titleBlock}>
          <RNView
            style={[styles.titleAccent, { backgroundColor: palette.tint }]}
          />
          <Text style={styles.title}>Plan</Text>
          <Text style={[styles.caption, { color: palette.textSecondary }]}>
            Add each payday source in naira (convert dollars, pounds, etc.
            yourself). Most income is every payday; add a one-time stream when
            money lands once (a loan paid back to you, a gig). Cushions use
            take-home for each month, including any one-off amounts in that
            month only.
          </Text>
        </RNView>

        <SectionCard
          title="Income streams"
          subtitle="Recurring pay plus one-off amounts (loan repaid to you, gigs) for a single month — tap a row to edit"
        >
          {incomeStreams.length === 0 ? (
            <Text style={[styles.hint, { color: palette.textMuted }]}>
              No streams yet — add one for each place pay hits your account
              (salary, contract, side gig).
            </Text>
          ) : (
            <RNView
              style={[
                styles.incomeList,
                { borderColor: palette.border },
                hairlineBorder(palette.border),
              ]}
            >
              {incomeStreams.map((stream, idx) => (
                <Pressable
                  key={stream.id}
                  accessibilityRole="button"
                  accessibilityHint="Opens editor for this income source"
                  onPress={() => setIncomeStreamSheetId(stream.id)}
                  style={({ pressed }) => [
                    styles.incomeListRow,
                    idx < incomeStreams.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: palette.border,
                    },
                    { opacity: pressed ? 0.92 : 1 },
                  ]}
                >
                  <RNView style={styles.incomeListTextCol}>
                    <Text
                      style={[styles.incomeListTitle, { color: palette.text }]}
                      numberOfLines={1}
                    >
                      {stream.label.trim() || "Untitled"}
                    </Text>
                    <Text
                      style={[
                        styles.incomeListSub,
                        { color: palette.textMuted },
                      ]}
                    >
                      {stream.recurrence === "one_time" && stream.oneTimeMonth
                        ? `One-time · ${formatMonthIdDisplay(stream.oneTimeMonth)} · ${
                            stream.amountNgn > 0
                              ? formatNgn(stream.amountNgn)
                              : "No amount yet"
                          }`
                        : stream.amountNgn > 0
                          ? `${formatNgn(stream.amountNgn)} · every payday`
                          : "No amount yet · every payday"}
                    </Text>
                  </RNView>
                  <FontAwesome
                    name="chevron-right"
                    size={14}
                    color={palette.textMuted}
                  />
                </Pressable>
              ))}
            </RNView>
          )}
          {incomeStreams.length > 0 ? (
            <Text style={[styles.incomeSumLine, { color: palette.textMuted }]}>
              Take-home this payday ({formatMonthIdDisplay(currentPaydayMonthId())}):{" "}
              {formatNgn(incomeSum)}
            </Text>
          ) : null}
          <PrimaryButton label="Add income source" onPress={onAddIncomeRow} />
        </SectionCard>

        <SectionCard title="Bills" subtitle="Monthly, between paydays">
          <FormField label="Bills (between paydays)">
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Opens list of monthly bills"
              onPress={() => setBillsOpen(true)}
              style={({ pressed }) => [
                styles.billsTrigger,
                monthTriggerStyle,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text
                style={[styles.billsTriggerText, { color: palette.text }]}
                numberOfLines={2}
              >
                {billsSummary}
              </Text>
              <FontAwesome name="list" size={18} color={palette.tint} />
            </Pressable>
          </FormField>
        </SectionCard>

        <SectionCard
          title="Receipt scan"
          subtitle="Photo or clipboard — add an expense from a receipt for the selected month."
        >
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Opens camera or photo library to scan a receipt"
            onPress={() => setReceiptScanOpen(true)}
            style={({ pressed }) => [
              styles.scanTrigger,
              monthTriggerStyle,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <FontAwesome name="camera" size={20} color={palette.tint} />
            <Text style={[styles.scanTriggerText, { color: palette.text }]}>
              Scan or import receipt
            </Text>
            <FontAwesome
              name="chevron-right"
              size={14}
              color={palette.textMuted}
            />
          </Pressable>
        </SectionCard>

        <SectionCard
          title="Add payday outflow"
          subtitle="One-off or recurring by month"
        >
          <FormField label="Month">
            <MonthPickerField
              value={addMonth}
              onChange={setAddMonth}
              palette={palette}
              triggerStyle={monthTriggerStyle}
            />
          </FormField>
          <FormField label="Label">
            <FluxTextInput
              value={addLabel}
              onChangeText={setAddLabel}
              placeholder="e.g. Rent, loan, major purchase"
            />
          </FormField>
          <FormField label="Amount">
            <FluxTextInput
              value={addAmount}
              onChangeText={(t) => setAddAmount(moneyDraftFromText(t))}
              keyboardType="number-pad"
              money
              placeholder="e.g. ₦85,000"
            />
          </FormField>

          <PrimaryButton label="Add item" onPress={onAddLine} />
        </SectionCard>

        <SectionCard
          title="Payday reminder"
          subtitle="Local notifications on your device"
        >
          <RNView style={styles.reminderRow}>
            <RNView style={styles.reminderTextCol}>
              <Text style={[styles.reminderTitle, { color: palette.text }]}>
                Monthly check-in
              </Text>
              <Text style={[styles.reminderSub, { color: palette.textMuted }]}>
                Day {reminderPrefs.dayOfMonth} at{" "}
                {String(reminderPrefs.hour).padStart(2, "0")}:
                {String(reminderPrefs.minute).padStart(2, "0")} (device local
                time). Optional nudge the day before when your check-in day is
                2–28.
              </Text>
            </RNView>
            <Switch
              accessibilityLabel="Toggle payday reminder"
              value={reminderPrefs.enabled}
              onValueChange={onReminderToggle}
              trackColor={{ false: palette.border, true: palette.tintMuted }}
              thumbColor={palette.surface}
            />
          </RNView>
          {reminderPrefs.enabled && reminderPrefs.dayOfMonth > 1 ? (
            <RNView style={[styles.reminderRow, { marginTop: spacing.md }]}>
              <RNView style={styles.reminderTextCol}>
                <Text style={[styles.reminderTitle, { color: palette.text }]}>
                  Day-before ping
                </Text>
                <Text
                  style={[styles.reminderSub, { color: palette.textMuted }]}
                >
                  “Review Flux before money lands.” Same time, calendar day{" "}
                  {reminderPrefs.dayOfMonth - 1}.
                </Text>
              </RNView>
              <Switch
                accessibilityLabel="Toggle day-before payday reminder"
                value={reminderPrefs.alsoRemindEve}
                onValueChange={(v) => void onReminderEveToggle(v)}
                trackColor={{ false: palette.border, true: palette.tintMuted }}
                thumbColor={palette.surface}
              />
            </RNView>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Backup"
          subtitle="JSON or CSV — keep a copy outside the phone"
        >
          <RNView style={styles.exportRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void onExportJson()}
              style={({ pressed }) => [
                styles.exportBtn,
                styles.exportBtnHalf,
                monthTriggerStyle,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <FontAwesome name="file-o" size={18} color={palette.tint} />
              <Text style={[styles.exportBtnText, { color: palette.text }]}>
                JSON
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void onExportCsv()}
              style={({ pressed }) => [
                styles.exportBtn,
                styles.exportBtnHalf,
                monthTriggerStyle,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <FontAwesome name="table" size={18} color={palette.tint} />
              <Text style={[styles.exportBtnText, { color: palette.text }]}>
                CSV
              </Text>
            </Pressable>
          </RNView>
          {/* <Text style={[styles.trustNote, { color: palette.textMuted }]}>
            App lock with Face ID or fingerprint is on the roadmap. Home-screen widgets (next payday + cushion) are a
            bigger lift — also planned.
          </Text> */}
        </SectionCard>

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
    </>
  );
}

const styles = StyleSheet.create({
  titleBlock: {
    marginBottom: 0,
  },
  titleAccent: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  caption: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
  },
  hint: {
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  incomeList: {
    borderRadius: radii.md,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  incomeListRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 52,
  },
  incomeListTextCol: {
    flex: 1,
    minWidth: 0,
  },
  incomeListTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  incomeListSub: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: "600",
  },
  incomeSumLine: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  scanTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 50,
  },
  scanTriggerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  billsTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 50,
    gap: 10,
  },
  billsTriggerText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  reminderTextCol: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  reminderSub: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  exportRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 50,
  },
  exportBtnHalf: {
    flex: 1,
  },
  exportBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  trustNote: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.md,
  },
});
