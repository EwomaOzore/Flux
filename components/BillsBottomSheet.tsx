import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FluxBottomSheet, FluxBottomSheetHeader } from '@/components/FluxBottomSheet';
import { MoneyText } from '@/components/MoneyText';
import { Text } from '@/components/Themed';
import { FluxTextInput, FormField, PrimaryButton, useFluxPalette } from '@/components/ui';
import { radii, spacing } from '@/constants/theme';
import { formatMoney, parseMoneyInput, sampleMoneyPlaceholder } from '@/src/lib/formatCurrency';
import { useCurrencyStore } from '@/src/state/currencyStore';
import { totalBillsAmount, clampDueDay } from '@/src/domain/types';
import { useBudgetStore } from '@/src/state/budgetStore';

function parseDueDayDraft(raw: string): number | undefined {
  if (!raw.trim()) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return clampDueDay(n);
}

function moneyDraftFromText(text: string): string {
  if (!text.replace(/\D/g, '')) return '';
  return formatMoney(parseMoneyInput(text));
}

type Props = {
  readonly visible: boolean;
  readonly onClose: () => void;
};

export function BillsBottomSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useFluxPalette();

  const billItems = useBudgetStore((s) => s.billItems);
  const addBill = useBudgetStore((s) => s.addBill);
  const updateBill = useBudgetStore((s) => s.updateBill);
  const deleteBill = useBudgetStore((s) => s.deleteBill);

  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDay, setNewDueDay] = useState('');

  const currencyCode = useCurrencyStore((s) => s.currencyCode);
  const sum = useMemo(() => totalBillsAmount(billItems), [billItems]);

  useEffect(() => {
    if (visible) {
      setNewLabel('');
      setNewAmount('');
      setNewDueDay('');
    }
  }, [visible]);

  const onAdd = useCallback(() => {
    const amount = parseMoneyInput(newAmount || '0');
    if (amount <= 0) {
      Alert.alert('Amount needed', 'Enter a positive amount.');
      return;
    }
    const dueDay = parseDueDayDraft(newDueDay);
    addBill({ label: newLabel.trim() || 'Bill', amount, dueDay });
    setNewLabel('');
    setNewAmount('');
    setNewDueDay('');
  }, [addBill, newAmount, newDueDay, newLabel]);

  const onDelete = useCallback(
    (id: string, label: string) => {
      Alert.alert('Remove this item?', label, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteBill(id) },
      ]);
    },
    [deleteBill],
  );

  return (
    <FluxBottomSheet visible={visible} onClose={onClose} snapPoints={['75%', '100%']}>
      <FluxBottomSheetHeader
        title="Bills"
        onClose={onClose}
        subtitle="Monthly costs between paydays — add each one; we total them for your cushion."
      />
      <Text style={[styles.sumLine, { color: palette.textMuted }]}>
        Total: {formatMoney(sum, currencyCode)}
      </Text>
      <View style={[styles.scrollInner, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {billItems.length > 0 ? (
          <View
            style={[
              styles.list,
              {
                borderColor: palette.cardBorder,
                backgroundColor: palette.inputBackground,
              },
            ]}
          >
            {billItems.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.row,
                  idx < billItems.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: palette.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.rowLabel, { color: palette.inputText }]}>
                  {item.label}
                </Text>
                <View style={styles.rowRight}>
                  <FluxTextInput
                    sheet
                    value={item.dueDay != null ? String(item.dueDay) : ''}
                    onChangeText={(t) => {
                      const digits = t.replace(/\D/g, '').slice(0, 2);
                      if (!digits) {
                        updateBill(item.id, { dueDay: undefined });
                        return;
                      }
                      const n = Number(digits);
                      if (n >= 1 && n <= 31) {
                        updateBill(item.id, { dueDay: n });
                      }
                    }}
                    keyboardType="number-pad"
                    placeholder="Day"
                    accessibilityLabel={`Due day for ${item.label}`}
                    style={styles.dayInput}
                  />
                  <MoneyText
                    amount={item.amount}
                    style={{ color: palette.textSecondary, fontWeight: '700' }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.label}`}
                    onPress={() => onDelete(item.id, item.label)}
                    hitSlop={8}
                    style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1, padding: 6 })}
                  >
                    <FontAwesome name="trash" size={15} color={palette.danger} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.empty, { color: palette.textMuted }]}>
            No items yet — add rent, utilities, subscriptions, loan payments, and anything else due each month.
          </Text>
        )}

        <FormField label="What is it?">
          <FluxTextInput
            sheet
            value={newLabel}
            onChangeText={setNewLabel}
            placeholder="e.g. Rent, electricity, subscriptions"
          />
        </FormField>
        <FormField label="Due day (optional)">
          <FluxTextInput
            sheet
            value={newDueDay}
            onChangeText={(t) => setNewDueDay(t.replace(/\D/g, '').slice(0, 2))}
            keyboardType="number-pad"
            placeholder="e.g. 1 for rent, 20 for a subscription"
          />
        </FormField>
        <FormField label="Amount">
          <FluxTextInput
            sheet
            value={newAmount}
            onChangeText={(t) => setNewAmount(moneyDraftFromText(t))}
            keyboardType="number-pad"
            money
            placeholder={`e.g. ${sampleMoneyPlaceholder(25000)}`}
          />
        </FormField>

        <PrimaryButton label="Add bill" onPress={onAdd} style={styles.addBtn} />
      </View>
    </FluxBottomSheet>
  );
}

const styles = StyleSheet.create({
  sumLine: {
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  scrollInner: {
    paddingHorizontal: spacing.lg,
  },
  list: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  dayInput: {
    width: 52,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  empty: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  addBtn: {
    marginTop: spacing.sm,
  },
});
