import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FluxBottomSheet,
  FluxBottomSheetHeader,
} from "@/components/FluxBottomSheet";
import { MonthPickerField } from "@/components/MonthPickerField";
import { Text } from "@/components/Themed";
import {
  FluxTextInput,
  FormField,
  PrimaryButton,
  useFluxPalette,
} from "@/components/ui";
import { radii, spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import {
  currentPaydayMonthId,
  endMonthForDuration,
  formatMonthIdShort,
  type MonthId,
} from "@/src/domain/month";
import {
  formatMoney,
  parseMoneyInput,
  sampleMoneyPlaceholder,
} from "@/src/lib/formatCurrency";
import { useBudgetStore } from "@/src/state/budgetStore";

function moneyDraftFromText(text: string): string {
  if (!text.replaceAll(/\D/g, "")) return "";
  return formatMoney(parseMoneyInput(text));
}

type LineRecurrence = "one_time" | "monthly";

type Props = {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly initialMonth?: MonthId;
  /** Called after a line is saved, with the month it was saved to. */
  readonly onAdded?: (month: MonthId) => void;
};

export function QuickAddLineSheet({
  visible,
  onClose,
  initialMonth,
  onAdded,
}: Props) {
  const insets = useSafeAreaInsets();
  const { palette, colorScheme } = useFluxPalette();
  const dark = colorScheme === "dark";
  const accent = dark ? "#48B872" : "#2B7A50";
  const addLine = useBudgetStore((s) => s.addLine);
  const [month, setMonth] = useState<MonthId>(
    initialMonth ?? currentPaydayMonthId(),
  );
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [recurrence, setRecurrence] = useState<LineRecurrence>("one_time");
  const [durationDraft, setDurationDraft] = useState("18");

  const durationMonths = useMemo(() => {
    const n = Number.parseInt(durationDraft.replaceAll(/\D/g, ""), 10);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(n, 600);
  }, [durationDraft]);

  const endMonth = useMemo(
    () => endMonthForDuration(month, durationMonths),
    [month, durationMonths],
  );

  const reset = useCallback(() => {
    setMonth(initialMonth ?? currentPaydayMonthId());
    setLabel("");
    setAmount("");
    setRecurrence("one_time");
    setDurationDraft("18");
  }, [initialMonth]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const onAdd = () => {
    const n = parseMoneyInput(amount || "0");
    if (n <= 0) {
      Alert.alert("Amount needed", "Enter a positive amount.");
      return;
    }
    const savedMonth = month;
    if (recurrence === "monthly") {
      addLine({
        month: savedMonth,
        label: label.trim() || "Payday item",
        amount: n,
        recurrence: "monthly",
        startMonth: savedMonth,
        endMonth,
      });
    } else {
      addLine({
        month: savedMonth,
        label: label.trim() || "Payday item",
        amount: n,
        recurrence: "one_time",
      });
    }
    onAdded?.(savedMonth);
    handleClose();
  };

  const triggerStyle = {
    borderWidth: 1,
    borderRadius: radii.md,
    borderColor: palette.cardBorder,
    backgroundColor: palette.inputBackground,
  };

  return (
    <FluxBottomSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={["78%", "94%"]}
    >
      <View style={{ paddingBottom: Math.max(insets.bottom, spacing.md) }}>
        <FluxBottomSheetHeader title="Quick add" onClose={handleClose} />
        <View style={styles.formWrap}>
          <FormField label="How often">
            <View style={styles.recRow}>
              {(
                [
                  { key: "one_time" as const, title: "One-time" },
                  { key: "monthly" as const, title: "Monthly" },
                ] as const
              ).map(({ key, title }) => {
                const active = recurrence === key;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setRecurrence(key)}
                    style={[
                      styles.recChip,
                      {
                        borderColor: active ? accent : palette.cardBorder,
                        backgroundColor: active
                          ? dark
                            ? "rgba(72,184,114,0.18)"
                            : palette.tintMuted
                          : palette.inputBackground,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontFamily: active ? typeface.bold : typeface.semibold,
                        fontSize: 15,
                        color: active ? accent : palette.textSecondary,
                      }}
                    >
                      {title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.recHint, { color: palette.textMuted }]}>
              {recurrence === "monthly"
                ? "Same amount every payday for a set number of months — e.g. a loan repayment."
                : "Counts only for the month you pick."}
            </Text>
          </FormField>

          <FormField label={recurrence === "monthly" ? "Starts" : "Month"}>
            <MonthPickerField
              value={month}
              onChange={setMonth}
              palette={palette}
              triggerStyle={triggerStyle}
            />
          </FormField>

          {recurrence === "monthly" ? (
            <FormField label="How many months">
              <FluxTextInput
                sheet
                value={durationDraft}
                onChangeText={(t) =>
                  setDurationDraft(t.replaceAll(/\D/g, "").slice(0, 3))
                }
                keyboardType="number-pad"
                placeholder="e.g. 18"
              />
              <Text style={[styles.recHint, { color: palette.textMuted }]}>
                {durationMonths} payday
                {durationMonths === 1 ? "" : "s"}:{" "}
                {formatMonthIdShort(month)} → {formatMonthIdShort(endMonth)}
              </Text>
            </FormField>
          ) : null}

          <FormField label="Label">
            <FluxTextInput
              sheet
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Loan repayment, school fees"
              returnKeyType="next"
            />
          </FormField>
          <FormField label="Amount each payday">
            <FluxTextInput
              sheet
              value={amount}
              onChangeText={(t) => setAmount(moneyDraftFromText(t))}
              keyboardType="number-pad"
              money
              placeholder={`e.g. ${sampleMoneyPlaceholder(300000)}`}
            />
          </FormField>
          <PrimaryButton
            label={
              recurrence === "monthly"
                ? `Add for ${durationMonths} months`
                : "Add item"
            }
            onPress={onAdd}
          />
        </View>
      </View>
    </FluxBottomSheet>
  );
}

const styles = StyleSheet.create({
  formWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  recRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  recChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  recHint: {
    fontFamily: typeface.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
});
