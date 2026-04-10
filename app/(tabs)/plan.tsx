import { type ReactNode, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View as RNView,
} from 'react-native';

import { MonthPickerField } from '@/components/MonthPickerField';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { cardElevation, radii, spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { formatNgn, parseNgnInput } from '@/src/lib/formatCurrency';
import { currentPaydayMonthId, type MonthId } from '@/src/domain/month';
import { useBudgetStore } from '@/src/state/budgetStore';

function moneyDraftFromText(text: string): string {
  return formatNgn(parseNgnInput(text));
}

export default function PlanScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

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

  const inputStyle = useMemo(
    () => ({
      borderColor: palette.borderStrong,
      color: palette.text,
      backgroundColor: palette.surfaceMuted,
    }),
    [palette.borderStrong, palette.text, palette.surfaceMuted]
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
    <ScrollView
      contentContainerStyle={styles.scroll}
      style={{ backgroundColor: palette.background }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <RNView style={styles.titleBlock}>
          <RNView style={[styles.titleAccent, { backgroundColor: palette.tint }]} />
          <Text style={styles.title}>Plan</Text>
          <Text style={[styles.caption, { color: palette.textSecondary }]}>
            Enter your net pay and staples, then add loans, purchases, and other payday outflows by month. The timeline
            only shows months where you have items.
          </Text>
        </RNView>

        <SectionCard palette={palette} colorScheme={colorScheme} title="Income" subtitle="Net pay & staples">
          <Field label="Net take-home (each payday)">
            <TextInput
              value={netDraft}
              onChangeText={(t) => setNetDraft(moneyDraftFromText(t))}
              onEndEditing={commitCore}
              keyboardType="number-pad"
              style={[styles.input, styles.inputMoney, inputStyle]}
              placeholder={formatNgn(0)}
              placeholderTextColor={palette.textMuted}
            />
          </Field>

          <Field label="Staples for the month between paydays">
            <TextInput
              value={staplesDraft}
              onChangeText={(t) => setStaplesDraft(moneyDraftFromText(t))}
              onEndEditing={commitCore}
              keyboardType="number-pad"
              style={[styles.input, styles.inputMoney, inputStyle]}
              placeholder={formatNgn(0)}
              placeholderTextColor={palette.textMuted}
            />
          </Field>
        </SectionCard>

        <SectionCard palette={palette} colorScheme={colorScheme} title="Add payday outflow" subtitle="One-off or recurring">
          <Field label="Month">
            <MonthPickerField
              value={addMonth}
              onChange={setAddMonth}
              palette={palette}
              triggerStyle={[styles.input, inputStyle]}
            />
          </Field>
          <Field label="Label">
            <TextInput
              value={addLabel}
              onChangeText={setAddLabel}
              style={[styles.input, inputStyle]}
              placeholder="Description"
              placeholderTextColor={palette.textMuted}
            />
          </Field>
          <Field label="Amount">
            <TextInput
              value={addAmount}
              onChangeText={(t) => setAddAmount(moneyDraftFromText(t))}
              keyboardType="number-pad"
              style={[styles.input, styles.inputMoney, inputStyle]}
              placeholder={formatNgn(0)}
              placeholderTextColor={palette.textMuted}
            />
          </Field>

          <Pressable
            onPress={onAddLine}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: palette.tint,
                opacity: pressed ? 0.9 : 1,
              },
              cardElevation(colorScheme),
            ]}>
            <Text style={styles.primaryBtnText}>Add item</Text>
          </Pressable>
        </SectionCard>

        <Pressable
          onPress={onStartOver}
          style={({ pressed }) => [
            styles.dangerBtn,
            {
              borderColor: palette.danger,
              backgroundColor: palette.dangerMuted,
              opacity: pressed ? 0.88 : 1,
            },
          ]}>
          <Text style={[styles.dangerBtnText, { color: palette.danger }]}>Start over</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  palette,
  colorScheme,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  palette: (typeof Colors)['light'];
  colorScheme: 'light' | 'dark' | null | undefined;
}) {
  return (
    <RNView
      style={[
        styles.sectionCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
        cardElevation(colorScheme),
      ]}>
      <RNView style={styles.sectionHead}>
        <RNView style={[styles.sectionIcon, { backgroundColor: palette.tintMuted }]}>
          <RNView style={[styles.sectionDot, { backgroundColor: palette.tint }]} />
        </RNView>
        <RNView style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={[styles.sectionSub, { color: palette.textMuted }]}>{subtitle}</Text>
        </RNView>
      </RNView>
      <RNView style={styles.sectionBody}>{children}</RNView>
    </RNView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <RNView style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </RNView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  container: {
    padding: spacing.lg,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
  titleBlock: {
    marginBottom: spacing.xs,
  },
  titleAccent: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  caption: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  sectionCard: {
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: 4,
  },
  field: {
    gap: 6,
    marginTop: spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    opacity: 0.75,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
  },
  inputMoney: {
    fontVariant: ['tabular-nums'],
  },
  primaryBtn: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dangerBtn: {
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
