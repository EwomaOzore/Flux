import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoneyText } from '@/components/MoneyText';
import { Text } from '@/components/Themed';
import { FluxTextInput, FormField, PrimaryButton, useFluxPalette } from '@/components/ui';
import { hairlineBorder, radii, spacing } from '@/constants/theme';
import { formatNgn, parseNgnInput } from '@/src/lib/formatCurrency';
import { totalBillsAmount } from '@/src/domain/types';
import { useBudgetStore } from '@/src/state/budgetStore';

function moneyDraftFromText(text: string): string {
  return formatNgn(parseNgnInput(text));
}

type Props = {
  readonly visible: boolean;
  readonly onClose: () => void;
};

export function BillsBottomSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { palette } = useFluxPalette();

  const sheetShort = Math.round(windowHeight * 0.75);
  const sheetFull = windowHeight;

  const [expanded, setExpanded] = useState(false);
  const heightAnim = useRef(new Animated.Value(sheetShort)).current;
  const prevVisibleRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      prevVisibleRef.current = false;
      return;
    }

    if (!prevVisibleRef.current) {
      prevVisibleRef.current = true;
      setExpanded(false);
      heightAnim.setValue(sheetShort);
      return;
    }

    const to = expanded ? sheetFull : sheetShort;
    Animated.spring(heightAnim, {
      toValue: to,
      useNativeDriver: false,
      friction: 9,
      tension: 65,
    }).start();
  }, [visible, expanded, sheetShort, sheetFull, heightAnim]);

  const billItems = useBudgetStore((s) => s.billItems);
  const addBill = useBudgetStore((s) => s.addBill);
  const deleteBill = useBudgetStore((s) => s.deleteBill);

  const [newLabel, setNewLabel] = useState('Rent');
  const [newAmount, setNewAmount] = useState(() => formatNgn(0));

  const sum = useMemo(() => totalBillsAmount(billItems), [billItems]);

  useEffect(() => {
    if (visible) {
      setNewAmount(formatNgn(0));
    }
  }, [visible]);

  const onAdd = useCallback(() => {
    const amount = parseNgnInput(newAmount);
    if (amount <= 0) {
      Alert.alert('Amount needed', 'Enter a positive amount.');
      return;
    }
    addBill({ label: newLabel.trim() || 'Bill', amount });
    setNewAmount(formatNgn(0));
  }, [addBill, newAmount, newLabel]);

  const onDelete = useCallback(
    (id: string, label: string) => {
      Alert.alert('Remove this item?', label, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteBill(id) },
      ]);
    },
    [deleteBill]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <Animated.View
          style={[
            styles.sheet,
            {
              height: heightAnim,
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
            hairlineBorder(palette.border),
          ]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.kav, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Pressable
              onPress={() => setExpanded((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'Collapse bills sheet' : 'Expand bills sheet to full screen'}
              style={[styles.handleZone, { borderBottomColor: palette.border }]}>
              <View style={[styles.handle, { backgroundColor: palette.borderStrong }]} />
              <Text
                style={[styles.handleHint, { color: palette.textMuted }]}>
                {expanded ? 'Tap for 75% height' : 'Tap for full screen'}
              </Text>
            </Pressable>

            <View style={styles.header}>
              <Text style={[styles.title, { color: palette.text }]}>Bills</Text>
              <Pressable onPress={onClose} hitSlop={14} accessibilityRole="button" accessibilityLabel="Done">
                <Text style={{ color: palette.tint, fontSize: 17, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>

            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              Monthly costs between paydays — add each one; we total them for your cushion.
            </Text>

            <Text style={[styles.sumLine, { color: palette.textMuted }]}>Total: {formatNgn(sum)}</Text>

            <ScrollView
              style={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {billItems.length > 0 ? (
                <View style={[styles.list, { borderColor: palette.border }]}>
                  {billItems.map((item, idx) => (
                    <View
                      key={item.id}
                      style={[
                        styles.row,
                        idx < billItems.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: palette.border,
                        },
                      ]}>
                      <Text style={[styles.rowLabel, { color: palette.text }]}>{item.label}</Text>
                      <View style={styles.rowRight}>
                        <MoneyText amount={item.amount} style={{ color: palette.textSecondary, fontWeight: '700' }} />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${item.label}`}
                          onPress={() => onDelete(item.id, item.label)}
                          hitSlop={8}
                          style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1, padding: 6 })}>
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
                <FluxTextInput value={newLabel} onChangeText={setNewLabel} placeholder="e.g. Rent, electricity" />
              </FormField>
              <FormField label="Amount">
                <FluxTextInput
                  value={newAmount}
                  onChangeText={(t) => setNewAmount(moneyDraftFromText(t))}
                  keyboardType="number-pad"
                  money
                  placeholder={formatNgn(0)}
                />
              </FormField>

              <PrimaryButton label="Add bill" onPress={onAdd} style={styles.addBtn} />
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000055',
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  kav: {
    flex: 1,
  },
  handleZone: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  handleHint: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  sumLine: {
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  scroll: {
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
