import { ScrollView, StyleSheet, View as RNView } from 'react-native';

import { MoneyText } from '@/components/MoneyText';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatNgn } from '@/src/lib/formatCurrency';
import { currentPaydayMonthId } from '@/src/domain/month';
import { rollupForCurrentPayday, useBudgetStore } from '@/src/state/budgetStore';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const roll = useBudgetStore((s) => rollupForCurrentPayday(s));
  const staplesPerMonth = useBudgetStore((s) => s.staplesPerMonth);
  const paydayMonth = currentPaydayMonthId();

  const cushion = roll?.cushionAfterStaples ?? 0;
  const cushionColor = cushion >= 0 ? '#059669' : '#dc2626';

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={{ backgroundColor: palette.background }}>
      <View style={styles.container}>
        <Text style={styles.kicker}>End-of-month payday</Text>
        <Text style={styles.monthLabel}>{paydayMonth}</Text>
        <Text style={styles.caption}>Salary lands for the month ahead; big bills hit the same run.</Text>

        <RNView
          style={[
            styles.hero,
            { borderColor: palette.tabIconDefault, backgroundColor: colorScheme === 'dark' ? '#111' : '#f8fafc' },
          ]}>
          <Text style={styles.heroLabel}>Cushion after staples</Text>
          <MoneyText amount={cushion} variant="titleEmphasis" style={{ color: cushionColor }} />
          <Text style={styles.heroHint}>
            Net pay {formatNgn(roll?.income ?? 0)} · Staples {formatNgn(staplesPerMonth)} · Payday out{' '}
            {formatNgn(roll?.totalPaydayOutflow ?? 0)}
          </Text>
        </RNView>

        <Text style={styles.sectionTitle}>This payday&apos;s line items</Text>
        {(roll?.lines.length ?? 0) === 0 ? (
          <Text style={styles.empty}>No items scheduled for this month — nice and quiet.</Text>
        ) : (
          roll!.lines.map((l) => (
            <RNView
              key={l.id}
              style={[
                styles.lineRow,
                { borderBottomColor: colorScheme === 'dark' ? '#333' : '#e5e7eb' },
              ]}>
              <Text style={styles.lineLabel}>{l.label}</Text>
              <MoneyText amount={-l.amount} style={styles.lineAmount} />
            </RNView>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  kicker: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.65,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  monthLabel: {
    fontSize: 34,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.8,
  },
  caption: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.78,
  },
  hero: {
    marginTop: 22,
    borderRadius: 16,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.72,
  },
  heroHint: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
  },
  sectionTitle: {
    marginTop: 26,
    fontSize: 17,
    fontWeight: '700',
  },
  empty: {
    marginTop: 10,
    opacity: 0.65,
    fontSize: 15,
    lineHeight: 22,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lineLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  lineAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
});
