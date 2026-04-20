import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, View as RNView } from 'react-native';

import { Text } from '@/components/Themed';
import { PrimaryButton, ScreenScroll, SectionCard, useFluxPalette } from '@/components/ui';
import { hairlineBorder, spacing } from '@/constants/theme';
import { buildExportCsv, buildExportJson } from '@/src/lib/exportBudget';
import { parseBudgetImportJson } from '@/src/lib/importBudget';
import type { BudgetState } from '@/src/state/budgetStore';
import { useBudgetStore } from '@/src/state/budgetStore';

const LAST_EXPORT_KEY = 'flux-last-exported-at';
const LAST_IMPORT_KEY = 'flux-last-imported-at';
type ImportMode = 'replace' | 'merge';

function mergeById<T extends { id: string }>(a: T[], b: T[]) {
  const map = new Map<string, T>();
  for (const x of a) map.set(x.id, x);
  for (const x of b) map.set(x.id, x);
  return [...map.values()];
}

export default function BackupScreen() {
  const { palette } = useFluxPalette();
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<BudgetState | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>('replace');
  const [lastExportedAt, setLastExportedAt] = useState<string | null>(null);
  const [lastImportedAt, setLastImportedAt] = useState<string | null>(null);

  const exportPayload = () => {
    const s = useBudgetStore.getState();
    return { incomeStreams: s.incomeStreams, billItems: s.billItems, lines: s.lines };
  };

  useEffect(() => {
    const loadMeta = async () => {
      const [ex, im] = await Promise.all([
        AsyncStorage.getItem(LAST_EXPORT_KEY),
        AsyncStorage.getItem(LAST_IMPORT_KEY),
      ]);
      setLastExportedAt(ex);
      setLastImportedAt(im);
    };
    void loadMeta();
  }, []);

  const saveMeta = async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
    if (key === LAST_EXPORT_KEY) setLastExportedAt(value);
    if (key === LAST_IMPORT_KEY) setLastImportedAt(value);
  };

  const onExportJson = async () => {
    try {
      await Share.share({ message: buildExportJson(exportPayload()), title: 'Flux backup (JSON)' });
      await saveMeta(LAST_EXPORT_KEY, new Date().toISOString());
    } catch {
      Alert.alert('Could not share', 'Try again or copy from a file manager.');
    }
  };

  const onExportCsv = async () => {
    try {
      await Share.share({ message: buildExportCsv(exportPayload()), title: 'Flux backup (CSV)' });
      await saveMeta(LAST_EXPORT_KEY, new Date().toISOString());
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
      setPreview(next);
      setPreviewFileName(picked.assets[0]?.name ?? 'Selected file');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not import this file.';
      Alert.alert('Import failed', msg);
    } finally {
      setImporting(false);
    }
  };

  const mergedCounts = useMemo(() => {
    if (!preview) return null;
    const current = exportPayload();
    return {
      income: mergeById(current.incomeStreams, preview.incomeStreams).length,
      bills: mergeById(current.billItems, preview.billItems).length,
      lines: mergeById(current.lines, preview.lines).length,
    };
  }, [preview]);

  const applyImport = async () => {
    if (!preview) return;
    const store = useBudgetStore.getState();
    if (importMode === 'replace') {
      store.setIncomeStreams(preview.incomeStreams);
      store.setBillItems(preview.billItems);
      store.setLines(preview.lines);
    } else {
      const s = useBudgetStore.getState();
      store.setIncomeStreams(mergeById(s.incomeStreams, preview.incomeStreams));
      store.setBillItems(mergeById(s.billItems, preview.billItems));
      store.setLines(mergeById(s.lines, preview.lines));
    }
    await saveMeta(LAST_IMPORT_KEY, new Date().toISOString());
    Alert.alert(
      'Import successful',
      importMode === 'replace'
        ? `Imported ${preview.incomeStreams.length} income streams, ${preview.billItems.length} bills, and ${preview.lines.length} payday outflows.`
        : 'Backup merged with your current data.',
    );
    setPreview(null);
    setPreviewFileName('');
  };

  return (
    <ScreenScroll>
      <SectionCard title="Status" subtitle="Recent backup activity on this device">
        <Text style={[styles.note, { color: palette.textMuted }]}>
          Last exported: {lastExportedAt ? new Date(lastExportedAt).toLocaleString() : 'Never'}
        </Text>
        <Text style={[styles.note, { color: palette.textMuted }]}>
          Last imported: {lastImportedAt ? new Date(lastImportedAt).toLocaleString() : 'Never'}
        </Text>
      </SectionCard>
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
          Pick a Flux JSON backup to preview before applying.
        </Text>
        <PrimaryButton
          label={importing ? 'Importing…' : 'Choose JSON file and import'}
          onPress={() => {
            if (importing) return;
            void onImport();
          }}
        />
        {preview ? (
          <RNView style={[styles.previewCard, { borderColor: palette.border }, hairlineBorder(palette.border)]}>
            <Text style={[styles.previewTitle, { color: palette.text }]}>Preview: {previewFileName}</Text>
            <Text style={[styles.note, { color: palette.textMuted }]}>
              Income streams: {preview.incomeStreams.length}
            </Text>
            <Text style={[styles.note, { color: palette.textMuted }]}>
              Bills: {preview.billItems.length}
            </Text>
            <Text style={[styles.note, { color: palette.textMuted }]}>
              Payday outflows: {preview.lines.length}
            </Text>
            <RNView style={styles.modeRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: importMode === 'replace' }}
                onPress={() => setImportMode('replace')}
                style={({ pressed }) => [
                  styles.modeChip,
                  {
                    borderColor: importMode === 'replace' ? palette.tint : palette.border,
                    backgroundColor: importMode === 'replace' ? palette.tintMuted : palette.surfaceMuted,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}>
                <Text style={{ color: importMode === 'replace' ? palette.tintStrong : palette.textSecondary, fontWeight: '700' }}>
                  Replace
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: importMode === 'merge' }}
                onPress={() => setImportMode('merge')}
                style={({ pressed }) => [
                  styles.modeChip,
                  {
                    borderColor: importMode === 'merge' ? palette.tint : palette.border,
                    backgroundColor: importMode === 'merge' ? palette.tintMuted : palette.surfaceMuted,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}>
                <Text style={{ color: importMode === 'merge' ? palette.tintStrong : palette.textSecondary, fontWeight: '700' }}>
                  Merge
                </Text>
              </Pressable>
            </RNView>
            {importMode === 'merge' && mergedCounts ? (
              <Text style={[styles.note, { color: palette.textMuted }]}>
                After merge: {mergedCounts.income} income streams, {mergedCounts.bills} bills, {mergedCounts.lines} outflows.
              </Text>
            ) : null}
            <RNView style={styles.row}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setPreview(null);
                  setPreviewFileName('');
                }}
                style={({ pressed }) => [
                  styles.btn,
                  styles.half,
                  { borderColor: palette.borderStrong, backgroundColor: palette.surfaceMuted, opacity: pressed ? 0.9 : 1 },
                  hairlineBorder(palette.borderStrong),
                ]}>
                <Text style={[styles.btnText, { color: palette.textSecondary }]}>Discard</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void applyImport()}
                style={({ pressed }) => [
                  styles.btn,
                  styles.half,
                  { borderColor: palette.tint, backgroundColor: palette.tintMuted, opacity: pressed ? 0.9 : 1 },
                  hairlineBorder(palette.tint),
                ]}>
                <Text style={[styles.btnText, { color: palette.tintStrong }]}>Apply import</Text>
              </Pressable>
            </RNView>
          </RNView>
        ) : null}
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
  previewCard: {
    marginTop: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    gap: 4,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  modeChip: {
    flex: 1,
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
