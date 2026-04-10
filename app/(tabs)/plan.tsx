import { type ReactNode, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View as RNView,
} from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import type { MonthId } from '@/src/domain/month';
import { useBudgetStore } from '@/src/state/budgetStore';

function parseMoney(raw: string): number {
  const cleaned = raw.replace(/,/g, '').trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function isMonthId(raw: string): raw is MonthId {
  return /^\d{4}-\d{2}$/.test(raw);
}

export default function PlanScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  const netSalary = useBudgetStore((s) => s.netSalary);
  const staplesPerMonth = useBudgetStore((s) => s.staplesPerMonth);
  const iphoneBalanceMonths = useBudgetStore((s) => s.iphoneBalanceMonths);
  const iphoneFirstBalanceMonth = useBudgetStore((s) => s.iphoneFirstBalanceMonth);
  const planFromMonth = useBudgetStore((s) => s.planFromMonth);
  const planToMonth = useBudgetStore((s) => s.planToMonth);

  const setNetSalary = useBudgetStore((s) => s.setNetSalary);
  const setStaplesPerMonth = useBudgetStore((s) => s.setStaplesPerMonth);
  const setIPhoneBalanceMonths = useBudgetStore((s) => s.setIPhoneBalanceMonths);
  const setIPhoneFirstBalanceMonth = useBudgetStore((s) => s.setIPhoneFirstBalanceMonth);
  const setPlanRange = useBudgetStore((s) => s.setPlanRange);
  const addLine = useBudgetStore((s) => s.addLine);
  const resetDemoScenario = useBudgetStore((s) => s.resetDemoScenario);

  const [netDraft, setNetDraft] = useState(String(netSalary));
  const [staplesDraft, setStaplesDraft] = useState(String(staplesPerMonth));
  const [fromDraft, setFromDraft] = useState<string>(planFromMonth);
  const [toDraft, setToDraft] = useState<string>(planToMonth);
  const [firstIphoneDraft, setFirstIphoneDraft] = useState<string>(iphoneFirstBalanceMonth);

  const [addMonth, setAddMonth] = useState<string>(planFromMonth);
  const [addLabel, setAddLabel] = useState('New payday item');
  const [addAmount, setAddAmount] = useState('0');

  const inputStyle = useMemo(
    () => ({
      borderColor: colorScheme === 'dark' ? '#444' : '#d1d5db',
      color: palette.text,
      backgroundColor: colorScheme === 'dark' ? '#0b0b0c' : '#fff',
    }),
    [colorScheme, palette.text]
  );

  const commitCore = () => {
    setNetSalary(parseMoney(netDraft));
    setStaplesPerMonth(parseMoney(staplesDraft));
    if (isMonthId(fromDraft) && isMonthId(toDraft)) {
      setPlanRange(fromDraft, toDraft);
    }
    if (isMonthId(firstIphoneDraft)) {
      setIPhoneFirstBalanceMonth(firstIphoneDraft);
    }
  };

  const onReset = () => {
    Alert.alert('Reset to demo scenario?', 'This replaces income, staples, and all payday line items.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          resetDemoScenario();
          const s = useBudgetStore.getState();
          setNetDraft(String(s.netSalary));
          setStaplesDraft(String(s.staplesPerMonth));
          setFromDraft(s.planFromMonth);
          setToDraft(s.planToMonth);
          setFirstIphoneDraft(s.iphoneFirstBalanceMonth);
          setAddMonth(s.planFromMonth);
        },
      },
    ]);
  };

  const onAddLine = () => {
    commitCore();
    if (!isMonthId(addMonth)) {
      Alert.alert('Check the month', 'Use YYYY-MM, e.g. 2026-05.');
      return;
    }
    const amount = parseMoney(addAmount);
    if (amount <= 0) {
      Alert.alert('Amount needed', 'Enter a positive amount.');
      return;
    }
    addLine({ month: addMonth as MonthId, label: addLabel.trim() || 'Payday item', amount });
    setAddAmount('0');
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={{ backgroundColor: palette.background }}>
      <View style={styles.container}>
        <Text style={styles.title}>Plan</Text>
        <Text style={styles.caption}>
          Edits auto-save. Commit core fields before adding line items so your range stays consistent.
        </Text>

        <Field label="Net take-home (each payday)">
          <TextInput
            value={netDraft}
            onChangeText={setNetDraft}
            onEndEditing={commitCore}
            keyboardType="number-pad"
            style={[styles.input, inputStyle]}
            placeholder="1585333"
            placeholderTextColor="#9ca3af"
          />
        </Field>

        <Field label="Staples for the month between paydays">
          <TextInput
            value={staplesDraft}
            onChangeText={setStaplesDraft}
            onEndEditing={commitCore}
            keyboardType="number-pad"
            style={[styles.input, inputStyle]}
            placeholder="256250"
            placeholderTextColor="#9ca3af"
          />
        </Field>

        <Field label="Timeline range (YYYY-MM)">
          <RNView style={styles.row}>
            <TextInput
              value={fromDraft}
              onChangeText={setFromDraft}
              onEndEditing={commitCore}
              autoCapitalize="none"
              style={[styles.input, styles.half, inputStyle]}
              placeholder="2026-04"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.dash}>→</Text>
            <TextInput
              value={toDraft}
              onChangeText={setToDraft}
              onEndEditing={commitCore}
              autoCapitalize="none"
              style={[styles.input, styles.half, inputStyle]}
              placeholder="2026-12"
              placeholderTextColor="#9ca3af"
            />
          </RNView>
        </Field>

        <Text style={styles.section}>iPhone balance split</Text>
        <Text style={styles.hint}>
          Recomputes rows whose IDs start with <Text style={{ fontWeight: '800' }}>iphone-bal</Text>. Other line
          items are untouched.
        </Text>

        <Field label="First balance month (YYYY-MM)">
          <TextInput
            value={firstIphoneDraft}
            onChangeText={setFirstIphoneDraft}
            onEndEditing={commitCore}
            autoCapitalize="none"
            style={[styles.input, inputStyle]}
            placeholder="2026-06"
            placeholderTextColor="#9ca3af"
          />
        </Field>

        <RNView style={styles.segment}>
          {([2, 3] as const).map((m) => {
            const selected = iphoneBalanceMonths === m;
            return (
              <Pressable
                key={m}
                onPress={() => {
                  commitCore();
                  setIPhoneBalanceMonths(m);
                }}
                style={[
                  styles.segmentBtn,
                  {
                    borderColor: selected ? palette.tint : inputStyle.borderColor,
                    backgroundColor: selected ? `${palette.tint}22` : 'transparent',
                  },
                ]}>
                <Text style={{ fontWeight: '700', color: palette.text }}>{m} months</Text>
              </Pressable>
            );
          })}
        </RNView>

        <Text style={styles.section}>Add payday outflow</Text>
        <Field label="Month (YYYY-MM)">
          <TextInput
            value={addMonth}
            onChangeText={setAddMonth}
            autoCapitalize="none"
            style={[styles.input, inputStyle]}
            placeholder="2026-05"
            placeholderTextColor="#9ca3af"
          />
        </Field>
        <Field label="Label">
          <TextInput
            value={addLabel}
            onChangeText={setAddLabel}
            style={[styles.input, inputStyle]}
            placeholder="Description"
            placeholderTextColor="#9ca3af"
          />
        </Field>
        <Field label="Amount">
          <TextInput
            value={addAmount}
            onChangeText={setAddAmount}
            keyboardType="number-pad"
            style={[styles.input, inputStyle]}
            placeholder="100000"
            placeholderTextColor="#9ca3af"
          />
        </Field>

        <Pressable
          onPress={onAddLine}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: palette.tint, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Text style={styles.primaryBtnText}>Add item</Text>
        </Pressable>

        <Pressable onPress={onReset} style={({ pressed }) => [styles.dangerBtn, { opacity: pressed ? 0.75 : 1 }]}>
          <Text style={styles.dangerBtnText}>Reset demo scenario</Text>
        </Pressable>
      </View>
    </ScrollView>
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
    paddingBottom: 40,
  },
  container: {
    padding: 20,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.75,
    marginBottom: 6,
  },
  field: {
    gap: 6,
    marginTop: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.72,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  dash: {
    opacity: 0.55,
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: '800',
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.68,
  },
  segment: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  segmentBtn: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtn: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  dangerBtn: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
