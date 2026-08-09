import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FluxBottomSheet, FluxBottomSheetHeader } from '@/components/FluxBottomSheet';
import { MoneyText } from '@/components/MoneyText';
import { Text } from '@/components/Themed';
import { useFluxPalette } from '@/components/ui/useFluxPalette';
import { spacing } from '@/constants/theme';

type Props = {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly monthLabel: string;
  readonly income: number;
  readonly billsTotal: number;
  readonly paydayOutflow: number;
  readonly cushion: number;
};

export function DiscretionaryInfoModal({
  visible,
  onClose,
  monthLabel,
  income,
  billsTotal,
  paydayOutflow,
  cushion,
}: Props) {
  const { palette } = useFluxPalette();
  const insets = useSafeAreaInsets();

  return (
    <FluxBottomSheet visible={visible} onClose={onClose} enableDynamicSizing variant="view">
      <View style={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}>
        <FluxBottomSheetHeader
          title="What's in this number?"
          onClose={onClose}
          closeLabel="Got it"
        />
        <View style={styles.body}>
          <Text style={[styles.lede, { color: palette.textSecondary }]}>
            For <Text style={[styles.ledeStrong, { color: palette.text }]}>{monthLabel}</Text>, cushion is what&apos;s
            left after your monthly bills and this month&apos;s planned payday outflows. That remainder covers day-to-day
            spending and anything you haven&apos;t listed yet — we call that discretionary in plain language.
          </Text>
          <View style={styles.rows}>
            <Row palette={palette} label="Take-home (all income streams)" amount={income} />
            <Row palette={palette} label="Monthly bills (from Plan)" amount={-billsTotal} signed />
            <Row palette={palette} label="This month's payday line items" amount={-paydayOutflow} signed />
            <View style={[styles.rule, { backgroundColor: palette.border }]} />
            <Row palette={palette} label="Cushion after bills" amount={cushion} emphasis />
          </View>
        </View>
      </View>
    </FluxBottomSheet>
  );
}

function Row({
  palette,
  label,
  amount,
  emphasis,
  signed,
}: {
  palette: { text: string; textSecondary: string };
  label: string;
  amount: number;
  emphasis?: boolean;
  signed?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.rowLabel,
          { color: emphasis ? palette.text : palette.textSecondary },
          emphasis && styles.rowLabelEm,
        ]}
      >
        {label}
      </Text>
      <MoneyText
        amount={amount}
        signed={signed}
        style={[
          styles.rowValue,
          { color: palette.text },
          emphasis && styles.rowValueEm,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  lede: {
    fontSize: 15,
    lineHeight: 22,
  },
  ledeStrong: {
    fontWeight: '700',
  },
  rows: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  rowLabelEm: {
    fontWeight: '700',
  },
  rowValue: {
    fontSize: 14,
  },
  rowValueEm: {
    fontSize: 16,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
});
