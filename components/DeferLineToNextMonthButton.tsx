import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet } from 'react-native';

import { useFluxPalette } from '@/components/ui/useFluxPalette';
import { radii } from '@/constants/theme';
import { addMonthsId } from '@/src/domain/month';
import type { PaydayLine } from '@/src/domain/types';
import { scheduleLineUndo } from '@/src/state/lineUndoStore';
import { useBudgetStore } from '@/src/state/budgetStore';

type Props = {
  readonly line: PaydayLine;
};

export function DeferLineToNextMonthButton({ line }: Props) {
  const { palette } = useFluxPalette();
  const updateLine = useBudgetStore((s) => s.updateLine);

  const onPress = () => {
    const nextMonth = addMonthsId(line.month, 1);
    scheduleLineUndo({ kind: 'defer', lineId: line.id, previousMonth: line.month });
    updateLine(line.id, { month: nextMonth });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Defer ${line.label} to next month`}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.hit,
        { backgroundColor: pressed ? palette.infoMuted : palette.surfaceMuted },
      ]}>
      <FontAwesome name="arrow-circle-right" size={17} color={palette.tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    padding: 8,
    borderRadius: radii.sm,
  },
});
