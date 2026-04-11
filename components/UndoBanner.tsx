import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useFluxPalette } from '@/components/ui/useFluxPalette';
import { radii, spacing } from '@/constants/theme';
import { useLineUndoStore } from '@/src/state/lineUndoStore';
import { useBudgetStore } from '@/src/state/budgetStore';

export function UndoBanner() {
  const { palette } = useFluxPalette();
  const payload = useLineUndoStore((s) => s.payload);
  const clearUndo = useLineUndoStore((s) => s.clear);
  const addLine = useBudgetStore((s) => s.addLine);
  const updateLine = useBudgetStore((s) => s.updateLine);

  if (!payload) return null;

  const message =
    payload.kind === 'delete'
      ? `Removed “${payload.line.label}”`
      : 'Moved to next month';

  const onUndo = () => {
    if (payload.kind === 'delete') {
      const { line } = payload;
      addLine({
        id: line.id,
        month: line.month,
        label: line.label,
        amount: line.amount,
      });
    } else {
      updateLine(payload.lineId, { month: payload.previousMonth });
    }
    clearUndo();
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: palette.surface,
          borderColor: palette.borderStrong,
        },
      ]}>
      <Text style={[styles.text, { color: palette.text }]} numberOfLines={2}>
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Undo last change"
        onPress={onUndo}
        hitSlop={12}
        style={({ pressed }) => [styles.undoBtn, { opacity: pressed ? 0.75 : 1 }]}>
        <Text style={[styles.undoText, { color: palette.tint }]}>Undo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  undoBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  undoText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
