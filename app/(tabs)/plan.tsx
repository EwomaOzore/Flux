import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View as RNView } from 'react-native';

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
import { useBudgetStore } from '@/src/state/budgetStore';

function moneyDraftFromText(text: string): string {
  return formatNgn(parseNgnInput(text));
}

export default function PlanScreen() {
  const { palette } = useFluxPalette();

  const netSalary = useBudgetStore((s) => s.netSalary);
  const staplesPerMonth = useBudgetStore((s) => s.staplesPerMonth);

  const setNetSalary = useBudgetStore((s) => s.setNetSalary);
  const setStaplesPerMonth = useBudgetStore((s) => s.setStaplesPerMonth);
  const addLine = useBudgetStore((s) => s.addLine);
  const resetBudget = useBudgetStore((s) => s.resetBudget);

  const [netDraft, setNetDraft] = useState(() => formatNgn(netSalary));
  const [staplesDraft, setStaplesDraft] = useState(() => formatNgn(staplesPerMonth));

  const [addMonth, setAddMonth] = useState<MonthId>(() => currentPaydayMonthId());
  const [addLabel, setAddLabel] = useState('New payday item');
  const [addAmount, setAddAmount] = useState(() => formatNgn(0));

  const monthTriggerStyle = useMemo(
    () => ({
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radii.md,
      borderColor: palette.borderStrong,
      backgroundColor: palette.surfaceMuted,
    }),
    [palette.borderStrong, palette.surfaceMuted]
  );

  const commitCore = () => {
    const net = parseNgnInput(netDraft);
    const staples = parseNgnInput(staplesDraft);
    setNetSalary(net);
    setStaplesPerMonth(staples);
    setNetDraft(formatNgn(net));
    setStaplesDraft(formatNgn(staples));
  };

  const onStartOver = () => {
    Alert.alert(
      'Start over?',
      'This clears all payday line items and sets net pay and staples to ₦0.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start over',
          style: 'destructive',
          onPress: () => {
            resetBudget();
            const s = useBudgetStore.getState();
            setNetDraft(formatNgn(s.netSalary));
            setStaplesDraft(formatNgn(s.staplesPerMonth));
            setAddMonth(currentPaydayMonthId());
          },
        },
      ]
    );
  };

  const onAddLine = () => {
    commitCore();
    const amount = parseNgnInput(addAmount);
    if (amount <= 0) {
      Alert.alert('Amount needed', 'Enter a positive amount.');
      return;
    }
    addLine({ month: addMonth, label: addLabel.trim() || 'Payday item', amount });
    setAddAmount(formatNgn(0));
  };

  return (
    <ScreenScroll>
      <RNView style={styles.titleBlock}>
        <RNView style={[styles.titleAccent, { backgroundColor: palette.tint }]} />
        <Text style={styles.title}>Plan</Text>
        <Text style={[styles.caption, { color: palette.textSecondary }]}>
          Enter your net pay and staples, then add loans, purchases, and other payday outflows by month. The timeline
          only shows months where you have items.
        </Text>
      </RNView>

      <SectionCard title="Income" subtitle="Net pay & staples">
        <FormField label="Net take-home (each payday)">
          <FluxTextInput
            value={netDraft}
            onChangeText={(t) => setNetDraft(moneyDraftFromText(t))}
            onEndEditing={commitCore}
            keyboardType="number-pad"
            money
            placeholder={formatNgn(0)}
          />
        </FormField>

        <FormField label="Staples for the month between paydays">
          <FluxTextInput
            value={staplesDraft}
            onChangeText={(t) => setStaplesDraft(moneyDraftFromText(t))}
            onEndEditing={commitCore}
            keyboardType="number-pad"
            money
            placeholder={formatNgn(0)}
          />
        </FormField>
      </SectionCard>

      <SectionCard title="Add payday outflow" subtitle="One-off or recurring">
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
});
