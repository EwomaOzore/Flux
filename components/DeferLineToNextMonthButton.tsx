import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { useFluxPalette } from '@/components/ui/useFluxPalette';
import { radii } from '@/constants/theme';
import { addMonthsId, formatMonthIdDisplay } from '@/src/domain/month';
import type { PaydayLine } from '@/src/domain/types';
import { useBudgetStore } from '@/src/state/budgetStore';

type Props = {
  readonly line: PaydayLine;
};

export function DeferLineToNextMonthButton({ line }: Props) {
  const { palette } = useFluxPalette();
  const updateLine = useBudgetStore((s) => s.updateLine);

  const onPress = () => {
    const nextMonth = addMonthsId(line.month, 1);
    Alert.alert(
      'Defer to next month?',
      `Move “${line.label}” (${formatNgnLine(line.amount)}) to ${formatMonthIdDisplay(nextMonth)}? It won’t count toward this month’s payday outflows anymore.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move',
          onPress: () => updateLine(line.id, { month: nextMonth }),
        },
      ],
    );
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

function formatNgnLine(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

const styles = StyleSheet.create({
  hit: {
    padding: 8,
    borderRadius: radii.sm,
  },
});
