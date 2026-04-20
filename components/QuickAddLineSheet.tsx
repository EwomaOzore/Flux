import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { FluxTextInput, FormField, PrimaryButton, useFluxPalette } from '@/components/ui';
import { hairlineBorder, radii, spacing } from '@/constants/theme';
import { type MonthId, currentPaydayMonthId } from '@/src/domain/month';
import { formatNgn, parseNgnInput } from '@/src/lib/formatCurrency';
import { useBudgetStore } from '@/src/state/budgetStore';
import { MonthPickerField } from '@/components/MonthPickerField';

function moneyDraftFromText(text: string): string {
  if (!text.replaceAll(/\D/g, '')) return '';
  return formatNgn(parseNgnInput(text));
}

type Props = {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly initialMonth?: MonthId;
};

export function QuickAddLineSheet({ visible, onClose, initialMonth }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useFluxPalette();
  const addLine = useBudgetStore((s) => s.addLine);
  const [month, setMonth] = useState<MonthId>(initialMonth ?? currentPaydayMonthId());
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
    const n = parseNgnInput(amount || '0');
    if (n <= 0) {
      Alert.alert('Amount needed', 'Enter a positive amount.');
      return;
    }
    addLine({ month, label: label.trim() || 'Payday item', amount: n });
    handleClose();
  };

  const triggerStyle = {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    borderColor: palette.borderStrong,
    backgroundColor: palette.surfaceMuted,
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel="Close quick add" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}
          style={[
            styles.sheet,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
            hairlineBorder(palette.border),
          ]}>
          <View style={[styles.handleZone, { borderBottomColor: palette.border }]}>
            <View style={[styles.handle, { backgroundColor: palette.borderStrong }]} />
          </View>
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.text }]}>Quick add</Text>
            <Pressable onPress={handleClose} hitSlop={14}>
              <Text style={{ color: palette.tint, fontSize: 17, fontWeight: '700' }}>Done</Text>
            </Pressable>
          </View>
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
                placeholder="e.g. ₦35,000"
              />
            </FormField>
            <PrimaryButton label="Add item" onPress={onAdd} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055' },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    overflow: 'hidden',
  },
  handleZone: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  handle: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  formWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});
