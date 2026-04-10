import { Alert, FlatList, Pressable, StyleSheet, View as RNView } from 'react-native';

import { MoneyText } from '@/components/MoneyText';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { selectRollupsForStore, useBudgetStore } from '@/src/state/budgetStore';
import type { MonthRollup } from '@/src/domain/types';

export default function TimelineScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const rollups = useBudgetStore((s) => selectRollupsForStore(s));
  const deleteLine = useBudgetStore((s) => s.deleteLine);

  const onDelete = (id: string, label: string) => {
    Alert.alert('Remove item?', label, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteLine(id) },
    ]);
  };

  const renderItem = ({ item }: { item: MonthRollup }) => {
    const cushionColor = item.cushionAfterStaples >= 0 ? '#059669' : '#dc2626';
    return (
      <RNView
        style={[
          styles.card,
          {
            borderColor: colorScheme === 'dark' ? '#333' : '#e5e7eb',
            backgroundColor: colorScheme === 'dark' ? '#111' : '#fff',
          },
        ]}>
        <RNView style={styles.cardHeader}>
          <Text style={styles.month}>{item.month}</Text>
          <RNView style={styles.cushionPill}>
            <Text style={[styles.cushionLabel, { color: cushionColor }]}>After staples</Text>
            <MoneyText amount={item.cushionAfterStaples} style={{ color: cushionColor, fontWeight: '700' }} />
          </RNView>
        </RNView>

        <RNView style={styles.metaRow}>
          <Text style={styles.metaMuted}>Payday outflows</Text>
          <MoneyText amount={item.totalPaydayOutflow} style={styles.metaValue} />
        </RNView>

        {item.lines.map((l) => (
          <RNView key={l.id} style={styles.lineRow}>
            <Text style={styles.lineLabel}>{l.label}</Text>
            <RNView style={styles.lineRight}>
              <MoneyText amount={l.amount} style={styles.lineAmount} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${l.label}`}
                onPress={() => onDelete(l.id, l.label)}
                hitSlop={10}
                style={({ pressed }) => [styles.trash, { opacity: pressed ? 0.45 : 1 }]}>
                <FontAwesome name="trash" size={16} color="#ef4444" />
              </Pressable>
            </RNView>
          </RNView>
        ))}
      </RNView>
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={rollups}
        keyExtractor={(r) => r.month}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={[styles.intro, { color: palette.text }]}>
            Each card is one payday at month-end. Cushion is what&apos;s left after your staples between paydays.
          </Text>
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
    padding: 16,
    paddingBottom: 32,
  },
  intro: {
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.78,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  month: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cushionPill: {
    alignItems: 'flex-end',
  },
  cushionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  metaMuted: {
    fontSize: 13,
    opacity: 0.65,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00000012',
  },
  lineLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  lineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lineAmount: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  trash: {
    padding: 6,
  },
});
