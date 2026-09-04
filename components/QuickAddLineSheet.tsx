import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FluxBottomSheet, FluxBottomSheetHeader } from '@/components/FluxBottomSheet';
import { FluxTextInput, FormField, PrimaryButton, useFluxPalette } from '@/components/ui';
import { radii, spacing } from '@/constants/theme';
import { type MonthId, currentPaydayMonthId } from '@/src/domain/month';
import { formatMoney, parseMoneyInput, sampleMoneyPlaceholder } from '@/src/lib/formatCurrency';
import { useBudgetStore } from '@/src/state/budgetStore';
import { MonthPickerField } from '@/components/MonthPickerField';

function moneyDraftFromText(text: string): string {
  if (!text.replaceAll(/\D/g, '')) return '';
  return formatMoney(parseMoneyInput(text));
}

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
  const { palette } = useFluxPalette();
  const addLine = useBudgetStore((s) => s.addLine);
  const [month, setMonth] = useState<MonthId>(
    initialMonth ?? currentPaydayMonthId(),
  );
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');

  const reset = useCallback(() => {
    setMonth(initialMonth ?? currentPaydayMonthId());
    setLabel('');
    setAmount('');
  }, [initialMonth]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const onAdd = () => {
    const n = parseMoneyInput(amount || '0');
    if (n <= 0) {
      Alert.alert('Amount needed', 'Enter a positive amount.');
      return;
    }
    const savedMonth = month;
    addLine({ month: savedMonth, label: label.trim() || 'Payday item', amount: n });
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
      enableDynamicSizing
      variant="view"
    >
      <View style={{ paddingBottom: Math.max(insets.bottom, spacing.md) }}>
        <FluxBottomSheetHeader title="Quick add" onClose={handleClose} />
        <View style={styles.formWrap}>
          <FormField label="Month">
            <MonthPickerField value={month} onChange={setMonth} palette={palette} triggerStyle={triggerStyle} />
          </FormField>
          <FormField label="Label">
            <FluxTextInput value={label} onChangeText={setLabel} placeholder="e.g. Rent, school fees, groceries" />
          </FormField>
          <FormField label="Amount">
            <FluxTextInput
              value={amount}
              onChangeText={(t) => setAmount(moneyDraftFromText(t))}
              keyboardType="number-pad"
              money
              placeholder={`e.g. ${sampleMoneyPlaceholder(35000)}`}
            />
          </FormField>
          <PrimaryButton label="Add item" onPress={onAdd} />
        </View>
      </View>
    </FluxBottomSheet>
  );
}

const styles = StyleSheet.create({
  formWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});
