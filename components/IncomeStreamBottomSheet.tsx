import { useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View as RNView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { DangerOutlineButton, FluxTextInput, FormField, useFluxPalette } from '@/components/ui';
import { hairlineBorder, radii, spacing } from '@/constants/theme';
import type { ThemePalette } from '@/constants/Colors';
import { currentPaydayMonthId } from '@/src/domain/month';
import { formatNgn, parseNgnInput } from '@/src/lib/formatCurrency';
import { useBudgetStore } from '@/src/state/budgetStore';

import { MonthPickerField } from '@/components/MonthPickerField';

type Props = {
  /** When set, the sheet is open for this stream id. */
  readonly streamId: string | null;
  readonly onClose: () => void;
};

export function IncomeStreamBottomSheet({ streamId, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useFluxPalette();
  const pickerPalette = palette as ThemePalette;
  const visible = streamId != null;

  const stream = useBudgetStore((s) =>
    streamId ? s.incomeStreams.find((x) => x.id === streamId) : undefined,
  );
  const updateIncomeStream = useBudgetStore((s) => s.updateIncomeStream);
  const removeIncomeStream = useBudgetStore((s) => s.removeIncomeStream);

  useEffect(() => {
    if (visible && streamId && !stream) {
      onClose();
    }
  }, [visible, streamId, stream, onClose]);

  const onRemove = () => {
    if (!streamId || !stream) return;
    const label = stream.label.trim() || 'This income stream';
    Alert.alert('Remove income stream?', `${label} will be removed from your plan.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeIncomeStream(streamId);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}
          style={[
            styles.sheet,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              paddingBottom: Math.max(insets.bottom, spacing.md),
              maxHeight: '88%',
            },
            hairlineBorder(palette.border),
          ]}>
          <View style={[styles.handleZone, { borderBottomColor: palette.border }]}>
            <View style={[styles.handle, { backgroundColor: palette.borderStrong }]} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.text }]}>Income source</Text>
            <Pressable onPress={onClose} hitSlop={14} accessibilityRole="button" accessibilityLabel="Done">
              <Text style={{ color: palette.tint, fontSize: 17, fontWeight: '700' }}>Done</Text>
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            Recurring pay counts every month. One-time pay (loan paid back to you, a gig) counts only in the month you
            pick. Notes are display-only if you converted currency.
          </Text>

          {stream ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scroll}>
              <FormField label="Label">
                <FluxTextInput
                  value={stream.label}
                  onChangeText={(t) => updateIncomeStream(stream.id, { label: t })}
                  placeholder="e.g. Main job, loan repayment, freelance"
                />
              </FormField>
              <FormField label="When it counts">
                <RNView style={styles.recRow}>
                  {(
                    [
                      { key: 'recurring' as const, title: 'Every payday' },
                      { key: 'one_time' as const, title: 'One-time' },
                    ] as const
                  ).map(({ key, title }) => {
                    const active = (stream.recurrence ?? 'recurring') === key;
                    return (
                      <Pressable
                        key={key}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() =>
                          updateIncomeStream(stream.id, {
                            recurrence: key,
                            ...(key === 'one_time'
                              ? {
                                  oneTimeMonth: stream.oneTimeMonth ?? currentPaydayMonthId(),
                                }
                              : { oneTimeMonth: undefined }),
                          })
                        }
                        style={[
                          styles.recChip,
                          {
                            borderColor: active ? palette.tint : palette.border,
                            backgroundColor: active ? palette.tintMuted : palette.surfaceMuted,
                          },
                        ]}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: active ? '800' : '600',
                            color: active ? palette.tintStrong : palette.textSecondary,
                          }}>
                          {title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </RNView>
                <Text style={[styles.recHint, { color: palette.textMuted }]}>
                  {(stream.recurrence ?? 'recurring') === 'one_time'
                    ? 'Counts only for that payday month — e.g. money someone owes you landing month-end.'
                    : 'Included in take-home for every payday month.'}
                </Text>
              </FormField>
              {(stream.recurrence ?? 'recurring') === 'one_time' ? (
                <FormField label="Payday month for this income">
                  <MonthPickerField
                    value={stream.oneTimeMonth ?? currentPaydayMonthId()}
                    onChange={(m) => updateIncomeStream(stream.id, { oneTimeMonth: m })}
                    palette={pickerPalette}
                    triggerStyle={{
                      borderWidth: StyleSheet.hairlineWidth,
                      borderRadius: radii.md,
                      borderColor: palette.borderStrong,
                      backgroundColor: palette.surfaceMuted,
                    }}
                  />
                </FormField>
              ) : null}
              <FormField label="Amount (₦)">
                <FluxTextInput
                  value={stream.amountNgn > 0 ? formatNgn(stream.amountNgn) : ''}
                  onChangeText={(t) => {
                    const n = parseNgnInput(t);
                    updateIncomeStream(stream.id, { amountNgn: Math.max(0, n) });
                  }}
                  keyboardType="number-pad"
                  money
                  placeholder="₦0"
                />
              </FormField>
              <FormField label="Note (optional)">
                <FluxTextInput
                  value={stream.note ?? ''}
                  onChangeText={(t) => updateIncomeStream(stream.id, { note: t || undefined })}
                  placeholder='e.g. "$700 wired" — display only'
                />
              </FormField>
              <DangerOutlineButton label="Remove income stream" onPress={onRemove} />
            </ScrollView>
          ) : null}
        </KeyboardAvoidingView>
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
    overflow: 'hidden',
  },
  handleZone: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
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
    paddingBottom: spacing.sm,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: 0,
  },
  recRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  recChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  recHint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
});
