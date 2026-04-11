import { useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { DangerOutlineButton, FluxTextInput, FormField, useFluxPalette } from '@/components/ui';
import { hairlineBorder, radii, spacing } from '@/constants/theme';
import { formatNgn, parseNgnInput } from '@/src/lib/formatCurrency';
import { useBudgetStore } from '@/src/state/budgetStore';

type Props = {
  /** When set, the sheet is open for this stream id. */
  readonly streamId: string | null;
  readonly onClose: () => void;
};

export function IncomeStreamBottomSheet({ streamId, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useFluxPalette();
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
            Take-home in ₦ for this payday cycle. Add a note if you converted from another currency — it&apos;s display
            only.
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
                  placeholder="e.g. Main job, US contract"
                />
              </FormField>
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
});
