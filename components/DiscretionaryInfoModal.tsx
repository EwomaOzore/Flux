import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useFluxPalette } from '@/components/ui/useFluxPalette';
import { hairlineBorder, radii, spacing } from '@/constants/theme';
import { formatNgn } from '@/src/lib/formatCurrency';

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
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss">
        <Pressable
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
            hairlineBorder(palette.border),
          ]}
          onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { color: palette.text }]}>What&apos;s in this number?</Text>
          <Text style={[styles.lede, { color: palette.textSecondary }]}>
            For <Text style={[styles.ledeStrong, { color: palette.text }]}>{monthLabel}</Text>, cushion is what&apos;s
            left after your monthly bills and this month&apos;s planned payday outflows. That remainder covers day-to-day
            spending and anything you haven&apos;t listed yet — we call that discretionary in plain language.
          </Text>
          <View style={styles.rows}>
            <Row palette={palette} label="Take-home (all income streams)" value={formatNgn(income)} />
            <Row palette={palette} label="Monthly bills (from Plan)" value={`−${formatNgn(billsTotal)}`} />
            <Row palette={palette} label="This month&apos;s payday line items" value={`−${formatNgn(paydayOutflow)}`} />
            <View style={[styles.rule, { backgroundColor: palette.border }]} />
            <Row palette={palette} label="Cushion after bills" value={formatNgn(cushion)} emphasis />
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
            <Text style={[styles.closeText, { color: palette.tint }]}>Got it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
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
  closeBtn: {
    marginTop: spacing.lg,
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
