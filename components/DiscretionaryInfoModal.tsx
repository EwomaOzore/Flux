import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FluxBottomSheet, FluxBottomSheetHeader } from '@/components/FluxBottomSheet';
import { Text } from '@/components/Themed';
import { useFluxPalette } from '@/components/ui/useFluxPalette';
import { spacing } from '@/constants/theme';
import { formatMoney } from '@/src/lib/formatCurrency';
import { useCurrencyStore } from '@/src/state/currencyStore';

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
  const currencyCode = useCurrencyStore((s) => s.currencyCode);

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
            <Row palette={palette} label="Take-home (all income streams)" value={formatMoney(income, currencyCode)} />
            <Row palette={palette} label="Monthly bills (from Plan)" value={`−${formatMoney(billsTotal, currencyCode)}`} />
            <Row palette={palette} label="This month's payday line items" value={`−${formatMoney(paydayOutflow, currencyCode)}`} />
            <View style={[styles.rule, { backgroundColor: palette.border }]} />
            <Row palette={palette} label="Cushion after bills" value={formatMoney(cushion, currencyCode)} emphasis />
          </View>
        </View>
      </View>
    </FluxBottomSheet>
  );
}

function Row({
  palette,
  label,
  value,
  emphasis,
}: {
  palette: { text: string; textSecondary: string };
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text
        style={[styles.rowLabel, { color: emphasis ? palette.text : palette.textSecondary }, emphasis && styles.rowLabelEm]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: palette.text }, emphasis && styles.rowValueEm]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
  },
  lede: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  ledeStrong: {
    fontWeight: '700',
  },
  rows: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    lineHeight: 20,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  rowValueEm: {
    fontWeight: '800',
    fontSize: 16,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
});
