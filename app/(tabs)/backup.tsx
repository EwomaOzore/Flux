import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, View as RNView } from 'react-native';

import { Text } from '@/components/Themed';
import { PrimaryButton, ScreenScroll, SectionCard, useFluxPalette } from '@/components/ui';
import { hairlineBorder, spacing } from '@/constants/theme';
import { buildExportCsv, buildExportJson } from '@/src/lib/exportBudget';
import { parseBudgetImportJson } from '@/src/lib/importBudget';
import { useBudgetStore } from '@/src/state/budgetStore';

export default function BackupScreen() {
  const { palette } = useFluxPalette();
  const [importing, setImporting] = useState(false);

  const exportPayload = () => {
    const s = useBudgetStore.getState();
    return { incomeStreams: s.incomeStreams, billItems: s.billItems, lines: s.lines };
  };

  const onExportJson = async () => {
    try {
      await Share.share({ message: buildExportJson(exportPayload()), title: 'Flux backup (JSON)' });
    } catch {
      Alert.alert('Could not share', 'Try again or copy from a file manager.');
    }
  };

  const onExportCsv = async () => {
    try {
      await Share.share({ message: buildExportCsv(exportPayload()), title: 'Flux backup (CSV)' });
    } catch {
      Alert.alert('Could not share', 'Try again or copy from a file manager.');
    }
  };

  const onImport = async () => {
    setImporting(true);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets[0]?.uri) return;
      const raw = await (await fetch(picked.assets[0].uri)).text();
      const next = parseBudgetImportJson(raw);
      const sampleIncome = next.incomeStreams
        .slice(0, 2)
        .map((s) => s.label || "Untitled")
        .join(", ");
      const sampleLines = next.lines
        .slice(0, 2)
        .map((l) => l.label || "Untitled")
        .join(", ");
      Alert.alert(
        'Preview import',
        `Income streams: ${next.incomeStreams.length}${
          sampleIncome ? ` (e.g. ${sampleIncome})` : ""
        }\nBills: ${next.billItems.length}\nPayday outflows: ${next.lines.length}${
          sampleLines ? ` (e.g. ${sampleLines})` : ""
        }\n\nThis will overwrite your current data.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: () => {
              const store = useBudgetStore.getState();
              store.setIncomeStreams(next.incomeStreams);
              store.setBillItems(next.billItems);
              store.setLines(next.lines);
              Alert.alert(
                'Import successful',
                `Imported ${next.incomeStreams.length} income streams, ${next.billItems.length} bills, and ${next.lines.length} payday outflows.`,
              );
            },
          },
        ],
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not import this file.';
      Alert.alert('Import failed', msg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <ScreenScroll>
      <SectionCard title="Backup" subtitle="Export your data anytime">
        <RNView style={styles.row}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void onExportJson()}
            style={({ pressed }) => [
              styles.btn,
              styles.half,
              { borderColor: palette.borderStrong, backgroundColor: palette.surfaceMuted, opacity: pressed ? 0.9 : 1 },
              hairlineBorder(palette.borderStrong),
            ]}>
            <FontAwesome name="file-o" size={18} color={palette.tint} />
            <Text style={[styles.btnText, { color: palette.text }]}>JSON</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void onExportCsv()}
            style={({ pressed }) => [
              styles.btn,
              styles.half,
              { borderColor: palette.borderStrong, backgroundColor: palette.surfaceMuted, opacity: pressed ? 0.9 : 1 },
              hairlineBorder(palette.borderStrong),
            ]}>
            <FontAwesome name="table" size={18} color={palette.tint} />
            <Text style={[styles.btnText, { color: palette.text }]}>CSV</Text>
          </Pressable>
        </RNView>
      </SectionCard>

      <SectionCard title="Import backup" subtitle="Restore data from a Flux JSON backup file">
        <Text style={[styles.note, { color: palette.textMuted }]}>
          Import replaces your current income streams, bills, and payday outflows.
        </Text>
        <PrimaryButton
          label={importing ? 'Importing…' : 'Choose JSON file and import'}
          onPress={() => {
            if (importing) return;
            void onImport();
          }}
        />
      </SectionCard>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  half: { flex: 1 },
  btnText: { fontSize: 16, fontWeight: '700' },
  note: { fontSize: 13, lineHeight: 19, marginBottom: spacing.md },
});
