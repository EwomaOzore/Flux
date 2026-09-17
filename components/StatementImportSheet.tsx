import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as DocumentPicker from "expo-document-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FluxBottomSheet,
  FluxBottomSheetHeader,
} from "@/components/FluxBottomSheet";
import { MoneyText } from "@/components/MoneyText";
import { Text } from "@/components/Themed";
import { FluxTextInput, PrimaryButton, useFluxPalette } from "@/components/ui";
import { radii, spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import { formatMonthIdShort } from "@/src/domain/month";
import { formatMoney, parseMoneyInput } from "@/src/lib/formatCurrency";
import {
  parseStatementCsv,
  suggestBillsFromTransactions,
  type BillSuggestion,
  type StatementParseResult,
} from "@/src/lib/statementImport";
import { useBudgetStore } from "@/src/state/budgetStore";

type SuggestionRow = BillSuggestion & {
  selected: boolean;
  amountDraft: string;
  duplicate: boolean;
};

type Props = {
  readonly visible: boolean;
  readonly onClose: () => void;
};

export function StatementImportSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { palette, colorScheme } = useFluxPalette();
  const dark = colorScheme === "dark";
  const accent = dark ? "#48B872" : "#2B7A50";
  const border = palette.cardBorder;

  const billItems = useBudgetStore((s) => s.billItems);
  const addBill = useBudgetStore((s) => s.addBill);

  const [parsed, setParsed] = useState<StatementParseResult | null>(null);
  const [rows, setRows] = useState<SuggestionRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) {
      setParsed(null);
      setRows([]);
      setFileName(null);
      setBusy(false);
    }
  }, [visible]);

  const existingLabels = useMemo(
    () => new Set(billItems.map((b) => b.label.trim().toLowerCase())),
    [billItems],
  );

  const onPickFile = useCallback(async () => {
    setBusy(true);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "text/plain"],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets[0]?.uri) return;
      const text = await (await fetch(picked.assets[0].uri)).text();
      const result = parseStatementCsv(text);
      const suggestions = suggestBillsFromTransactions(result.transactions);
      if (suggestions.length === 0) {
        Alert.alert(
          "No recurring debits found",
          `Read ${result.transactions.length} debits, but none repeated across months with a stable amount. You can still add bills manually in Plan.`,
        );
        return;
      }
      setParsed(result);
      setFileName(picked.assets[0].name ?? "Statement");
      setRows(
        suggestions.map((s) => {
          const duplicate = existingLabels.has(s.label.trim().toLowerCase());
          return {
            ...s,
            duplicate,
            selected: !duplicate,
            amountDraft: formatMoney(s.amount),
          };
        }),
      );
    } catch (e) {
      Alert.alert(
        "Couldn't read statement",
        e instanceof Error ? e.message : "Unknown error reading the file.",
      );
    } finally {
      setBusy(false);
    }
  }, [existingLabels]);

  const toggleRow = useCallback((key: string) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, selected: !r.selected } : r)),
    );
  }, []);

  const setRowAmount = useCallback((key: string, text: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? {
              ...r,
              amountDraft: text.replaceAll(/\D/g, "")
                ? formatMoney(parseMoneyInput(text))
                : "",
            }
          : r,
      ),
    );
  }, []);

  const selectedCount = rows.filter(
    (r) => r.selected && parseMoneyInput(r.amountDraft) > 0,
  ).length;

  const onAddSelected = useCallback(() => {
    const toAdd = rows.filter(
      (r) => r.selected && parseMoneyInput(r.amountDraft) > 0,
    );
    if (toAdd.length === 0) {
      Alert.alert("Nothing selected", "Tick at least one suggestion to add.");
      return;
    }
    for (const r of toAdd) {
      addBill({ label: r.label, amount: parseMoneyInput(r.amountDraft) });
    }
    Alert.alert(
      "Bills added",
      `Added ${toAdd.length} bill${toAdd.length === 1 ? "" : "s"} from your statement. Edit or remove them anytime in Plan → Recurring bills.`,
    );
    onClose();
  }, [addBill, onClose, rows]);

  const rangeLabel =
    parsed?.firstMonth && parsed.lastMonth
      ? parsed.firstMonth === parsed.lastMonth
        ? formatMonthIdShort(parsed.firstMonth)
        : `${formatMonthIdShort(parsed.firstMonth)} – ${formatMonthIdShort(parsed.lastMonth)}`
      : null;

  return (
    <FluxBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={["80%", "94%"]}
    >
      <View style={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}>
        <FluxBottomSheetHeader
          title="Import bank statement"
          onClose={onClose}
          subtitle="Pick a CSV export from your bank app. It's read on this device only — nothing is uploaded."
        />

        <View style={styles.body}>
          {parsed === null ? (
            <>
              <View
                style={[
                  styles.helpCard,
                  {
                    backgroundColor: palette.inputBackground,
                    borderColor: border,
                  },
                ]}
              >
                <Text style={[styles.helpTitle, { color: palette.text }]}>
                  How it works
                </Text>
                <Text style={[styles.helpBody, { color: palette.textMuted }]}>
                  1. In your bank app, export your statement as CSV (3–6 months
                  works best).{"\n"}
                  2. Pick the file below. Flux finds debits that repeat monthly
                  with a stable amount.{"\n"}
                  3. Review the suggestions, adjust amounts, and add the ones
                  that are real bills.
                </Text>
              </View>
              <PrimaryButton
                label={busy ? "Reading…" : "Choose CSV file"}
                onPress={() => void onPickFile()}
              />
            </>
          ) : (
            <>
              <Text style={[styles.metaLine, { color: palette.textMuted }]}>
                {fileName} · {parsed.transactions.length} debits
                {rangeLabel ? ` · ${rangeLabel}` : ""}
              </Text>

              <View
                style={[
                  styles.listCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: border,
                  },
                ]}
              >
                {rows.map((row, idx) => (
                  <View
                    key={row.key}
                    style={[
                      styles.suggestionRow,
                      idx < rows.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: border,
                      },
                    ]}
                  >
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: row.selected }}
                      accessibilityLabel={`${row.selected ? "Deselect" : "Select"} ${row.label}`}
                      onPress={() => toggleRow(row.key)}
                      hitSlop={10}
                      style={[
                        styles.checkbox,
                        {
                          borderColor: row.selected ? accent : border,
                          backgroundColor: row.selected
                            ? accent
                            : "transparent",
                        },
                      ]}
                    >
                      {row.selected ? (
                        <FontAwesome name="check" size={11} color="#FFFFFF" />
                      ) : null}
                    </Pressable>
                    <View style={styles.suggestionText}>
                      <Text
                        style={[
                          styles.suggestionLabel,
                          { color: palette.text },
                        ]}
                        numberOfLines={1}
                      >
                        {row.label}
                      </Text>
                      <Text
                        style={[
                          styles.suggestionSub,
                          { color: palette.textMuted },
                        ]}
                        numberOfLines={1}
                      >
                        {row.duplicate
                          ? "Already in your bills"
                          : `Seen ${row.occurrences}× across ${row.monthsSeen} months`}
                      </Text>
                    </View>
                    <FluxTextInput
                      sheet
                      value={row.amountDraft}
                      onChangeText={(t) => setRowAmount(row.key, t)}
                      keyboardType="number-pad"
                      money
                      style={styles.amountInput}
                      accessibilityLabel={`Amount for ${row.label}`}
                    />
                  </View>
                ))}
              </View>

              <PrimaryButton
                label={
                  selectedCount > 0
                    ? `Add ${selectedCount} bill${selectedCount === 1 ? "" : "s"}`
                    : "Add bills"
                }
                onPress={onAddSelected}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => void onPickFile()}
                style={({ pressed }) => [
                  styles.repickBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.repickText, { color: accent }]}>
                  Choose a different file
                </Text>
              </Pressable>
            </>
          )}

          <View style={styles.suggestionTotal}>
            {parsed !== null && selectedCount > 0 ? (
              <>
                <Text style={[styles.totalLabel, { color: palette.textMuted }]}>
                  Monthly total of selected:
                </Text>
                <MoneyText
                  amount={rows
                    .filter((r) => r.selected)
                    .reduce((s, r) => s + parseMoneyInput(r.amountDraft), 0)}
                  style={{ color: palette.text, fontSize: 14 }}
                />
              </>
            ) : null}
          </View>
        </View>
      </View>
    </FluxBottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  helpCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  helpTitle: {
    fontFamily: typeface.semibold,
    fontSize: 15,
  },
  helpBody: {
    fontFamily: typeface.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  metaLine: {
    fontFamily: typeface.regular,
    fontSize: 13,
  },
  listCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 62,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  suggestionLabel: {
    fontFamily: typeface.regular,
    fontSize: 14,
  },
  suggestionSub: {
    fontFamily: typeface.regular,
    fontSize: 12,
  },
  amountInput: {
    width: 110,
    paddingVertical: 8,
    fontSize: 14,
    textAlign: "right",
  },
  repickBtn: {
    alignSelf: "center",
    paddingVertical: spacing.xs,
  },
  repickText: {
    fontFamily: typeface.semibold,
    fontSize: 14,
  },
  suggestionTotal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 20,
  },
  totalLabel: {
    fontFamily: typeface.regular,
    fontSize: 13,
  },
});
