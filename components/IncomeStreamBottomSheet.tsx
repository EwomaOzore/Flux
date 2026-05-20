import { useEffect } from 'react';
import { Alert, Pressable, StyleSheet, View as RNView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FluxBottomSheet, FluxBottomSheetHeader } from '@/components/FluxBottomSheet';
import { Text } from '@/components/Themed';
import { DangerOutlineButton, FluxTextInput, FormField, useFluxPalette } from '@/components/ui';
import { radii, spacing } from '@/constants/theme';
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
    <FluxBottomSheet visible={visible} onClose={onClose} snapPoints={['88%']}>
      <FluxBottomSheetHeader
        title="Income source"
        onClose={onClose}
        subtitle="Recurring pay counts every month. One-time pay (loan paid back to you, a gig) counts only in the month you pick. Notes are display-only if you converted currency."
      />
      {stream ? (
        <RNView style={[styles.scroll, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
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
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: active ? '800' : '600',
                        color: active ? palette.tintStrong : palette.textSecondary,
                      }}
                    >
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
        </RNView>
      ) : null}
    </FluxBottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
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
