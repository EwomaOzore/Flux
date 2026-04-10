import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View as RNView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { BillsBottomSheet } from '@/components/BillsBottomSheet';
import { MonthPickerField } from '@/components/MonthPickerField';
import { Text } from '@/components/Themed';
import {
  DangerOutlineButton,
  FluxTextInput,
  FormField,
  PrimaryButton,
  ScreenScroll,
  SectionCard,
  useFluxPalette,
} from '@/components/ui';
import { radii } from '@/constants/theme';
import { formatNgn, parseNgnInput } from '@/src/lib/formatCurrency';
import { currentPaydayMonthId, type MonthId } from '@/src/domain/month';
import { totalBillsAmount } from '@/src/domain/types';
import { useBudgetStore } from '@/src/state/budgetStore';

function moneyDraftFromText(text: string): string {
  return formatNgn(parseNgnInput(text));
}

export default function PlanScreen() {
  const { palette } = useFluxPalette();

  const netSalary = useBudgetStore((s) => s.netSalary);
  const billItems = useBudgetStore((s) => s.billItems);

  const setNetSalary = useBudgetStore((s) => s.setNetSalary);
  const addLine = useBudgetStore((s) => s.addLine);
  const resetBudget = useBudgetStore((s) => s.resetBudget);

  const [netDraft, setNetDraft] = useState(() => formatNgn(netSalary));
  const [billsOpen, setBillsOpen] = useState(false);

  const [addMonth, setAddMonth] = useState<MonthId>(() => currentPaydayMonthId());
  const [addLabel, setAddLabel] = useState('New payday item');
  const [addAmount, setAddAmount] = useState(() => formatNgn(0));

  const billsSum = useMemo(() => totalBillsAmount(billItems), [billItems]);

  const monthTriggerStyle = useMemo(
    () => ({
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radii.md,
      borderColor: palette.borderStrong,
      backgroundColor: palette.surfaceMuted,
    }),
    [palette.borderStrong, palette.surfaceMuted]
  );

  const commitNet = () => {
    const net = parseNgnInput(netDraft);
    setNetSalary(net);
    setNetDraft(formatNgn(net));
  };

  const onStartOver = () => {
    Alert.alert('Start over?', 'This clears payday outflows, bills, and sets net pay to ₦0.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start over',
        style: 'destructive',
        onPress: () => {
          resetBudget();
          const s = useBudgetStore.getState();
          setNetDraft(formatNgn(s.netSalary));
          setAddMonth(currentPaydayMonthId());
        },
      },
    ]);
  };

  const onAddLine = () => {
    commitNet();
    const amount = parseNgnInput(addAmount);
    if (amount <= 0) {
      Alert.alert('Amount needed', 'Enter a positive amount.');
      return;
    }
    addLine({ month: addMonth, label: addLabel.trim() || 'Payday item', amount });
    setAddAmount(formatNgn(0));
  };

  const billsSummary =
    billItems.length === 0
      ? 'Tap to add rent, utilities, subscriptions…'
      : `${billItems.length} ${billItems.length === 1 ? 'item' : 'items'} · ${formatNgn(billsSum)}`;

  return (
    <>
      <ScreenScroll>
        <RNView style={styles.titleBlock}>
          <RNView style={[styles.titleAccent, { backgroundColor: palette.tint }]} />
          <Text style={styles.title}>Plan</Text>
          <Text style={[styles.caption, { color: palette.textSecondary }]}>
            Set net pay and monthly bills between paydays, then add big payday outflows by month. The timeline lists
            months where you have payday line items.
          </Text>
        </RNView>

        <SectionCard title="Income" subtitle="Net pay & bills">
          <FormField label="Net take-home (each payday)">
            <FluxTextInput
              value={netDraft}
              onChangeText={(t) => setNetDraft(moneyDraftFromText(t))}
              onEndEditing={commitNet}
              keyboardType="number-pad"
              money
              placeholder={formatNgn(0)}
            />
          </FormField>

          <FormField label="Bills (between paydays)">
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Opens list of monthly bills"
              onPress={() => setBillsOpen(true)}
              style={({ pressed }) => [
                styles.billsTrigger,
                monthTriggerStyle,
                { opacity: pressed ? 0.9 : 1 },
              ]}>
              <Text
                style={[styles.billsTriggerText, { color: palette.text }]}
                numberOfLines={2}>
                {billsSummary}
              </Text>
              <FontAwesome name="list" size={18} color={palette.tint} />
            </Pressable>
          </FormField>
        </SectionCard>

        <SectionCard title="Add payday outflow" subtitle="One-off or recurring by month">
          <FormField label="Month">
            <MonthPickerField value={addMonth} onChange={setAddMonth} palette={palette} triggerStyle={monthTriggerStyle} />
          </FormField>
          <FormField label="Label">
            <FluxTextInput value={addLabel} onChangeText={setAddLabel} placeholder="Description" />
          </FormField>
          <FormField label="Amount">
            <FluxTextInput
              value={addAmount}
              onChangeText={(t) => setAddAmount(moneyDraftFromText(t))}
              keyboardType="number-pad"
              money
              placeholder={formatNgn(0)}
            />
          </FormField>

          <PrimaryButton label="Add item" onPress={onAddLine} />
        </SectionCard>

        <DangerOutlineButton label="Start over" onPress={onStartOver} />
      </ScreenScroll>

      <BillsBottomSheet visible={billsOpen} onClose={() => setBillsOpen(false)} />
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
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  caption: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
  },
  billsTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 50,
    gap: 10,
  },
  billsTriggerText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});
