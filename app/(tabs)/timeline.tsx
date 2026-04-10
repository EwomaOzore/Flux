import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View as RNView } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { MoneyText } from '@/components/MoneyText';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { cardElevation, hairlineBorder, radii, spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { formatMonthIdDisplay } from '@/src/domain/month';
import { computeRollups, useBudgetStore } from '@/src/state/budgetStore';
import type { MonthRollup } from '@/src/domain/types';

const ACCENTS = ['tint', 'accentBlue', 'accentViolet', 'accentAmber', 'accentRose'] as const;

export default function TimelineScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const tabBarHeight = useBottomTabBarHeight();
  const budgetForRollup = useBudgetStore(
    useShallow((s) => ({
      netSalary: s.netSalary,
      billItems: s.billItems,
      lines: s.lines,
    }))
  );
  const rollups = useMemo(() => computeRollups(budgetForRollup), [budgetForRollup]);
  const deleteLine = useBudgetStore((s) => s.deleteLine);

  const onDelete = (id: string, label: string) => {
    Alert.alert('Remove item?', label, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteLine(id) },
    ]);
  };

  const renderItem = ({ item, index }: { item: MonthRollup; index: number }) => {
    const accentKey = ACCENTS[index % ACCENTS.length];
    const accentColor = palette[accentKey];
    const positive = item.cushionAfterBills >= 0;
    const cushionColor = positive ? palette.success : palette.danger;
    const cushionBg = positive ? palette.successMuted : palette.dangerMuted;

    return (
      <RNView
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
          cardElevation(colorScheme),
        ]}>
        <RNView style={[styles.cardAccent, { backgroundColor: accentColor }]} />
        <RNView style={styles.cardInner}>
          <RNView style={styles.cardHeader}>
            <RNView style={[styles.monthPill, { backgroundColor: palette.tintMuted }]}>
              <Text style={[styles.monthPillText, { color: palette.tintStrong }]}>
                {formatMonthIdDisplay(item.month)}
              </Text>
            </RNView>
            <RNView style={[styles.cushionBlock, { backgroundColor: cushionBg }]}>
              <Text style={[styles.cushionLabel, { color: cushionColor }]}>After bills</Text>
              <MoneyText amount={item.cushionAfterBills} style={{ color: cushionColor, fontWeight: '800' }} />
            </RNView>
          </RNView>

          <RNView style={[styles.metaRow, { borderColor: palette.border }]}>
            <Text style={[styles.metaMuted, { color: palette.textMuted }]}>Payday outflows</Text>
            <MoneyText amount={item.totalPaydayOutflow} style={[styles.metaValue, { color: palette.text }]} />
          </RNView>

          <RNView style={[styles.metaRow, { borderColor: palette.border }]}>
            <Text style={[styles.metaMuted, { color: palette.textMuted }]}>Monthly bills</Text>
            <MoneyText amount={item.billsTotal} style={[styles.metaValue, { color: palette.text }]} />
          </RNView>

          {item.lines.map((l, lineIdx) => (
            <RNView
              key={l.id}
              style={[
                styles.lineRow,
                lineIdx > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: palette.border,
                },
              ]}>
              <RNView style={[styles.lineAccent, { backgroundColor: accentColor }]} />
              <Text style={[styles.lineLabel, { color: palette.text }]}>{l.label}</Text>
              <RNView style={styles.lineRight}>
                <MoneyText amount={l.amount} style={[styles.lineAmount, { color: palette.textSecondary }]} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${l.label}`}
                  onPress={() => onDelete(l.id, l.label)}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.trash,
                    {
                      backgroundColor: pressed ? palette.dangerMuted : palette.surfaceMuted,
                    },
                  ]}>
                  <FontAwesome name="trash" size={15} color={palette.danger} />
                </Pressable>
              </RNView>
            </RNView>
          ))}
        </RNView>
      </RNView>
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={rollups}
        keyExtractor={(r) => r.month}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          rollups.length === 0 && styles.listEmpty,
          { paddingBottom: Math.max(40, tabBarHeight + spacing.md) },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <RNView
            style={[
              styles.introCard,
              {
                backgroundColor: palette.infoMuted,
                borderColor: palette.border,
              },
              hairlineBorder(palette.border),
            ]}>
            <Text style={[styles.introTitle, { color: palette.info }]}>How to read this</Text>
            <Text style={[styles.intro, { color: palette.textSecondary }]}>
              Each card ties a month to a payday outflow. We subtract your bills total (from Plan) plus those outflows
              from net pay to get cushion. Add bills and line items in Plan — months appear here automatically.
            </Text>
          </RNView>
        }
        ListEmptyComponent={
          <RNView style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>No months yet</Text>
            <Text style={[styles.emptyBody, { color: palette.textMuted }]}>
              Add a payday outflow in Plan (rent, loan, purchase, etc.). That month will show up here with your cushion
              for that payday.
            </Text>
          </RNView>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    padding: spacing.lg,
  },
  listEmpty: {
    flexGrow: 1,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  introCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  introTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  intro: {
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  cardInner: {
    paddingLeft: spacing.lg + 2,
    paddingRight: spacing.md,
    paddingVertical: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  monthPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  monthPillText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cushionBlock: {
    alignItems: 'flex-end',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 120,
  },
  cushionLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  metaMuted: {
    fontSize: 13,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  lineAccent: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  lineLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500',
  },
  lineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lineAmount: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  trash: {
    padding: 8,
    borderRadius: radii.sm,
  },
});
