import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, View as RNView } from 'react-native';

import { Text } from '@/components/Themed';
import { PrimaryButton, ScreenScroll, SectionCard, useFluxPalette } from '@/components/ui';
import { hairlineBorder, spacing } from '@/constants/theme';
import { buildExportCsv, buildExportJson } from '@/src/lib/exportBudget';
import { listActivity, logActivity } from '@/src/lib/activityLog';
import { parseBudgetImportJson } from '@/src/lib/importBudget';
import type { BudgetState } from '@/src/state/budgetStore';
import { useBudgetStore } from '@/src/state/budgetStore';

const LAST_EXPORT_KEY = 'flux-last-exported-at';
const LAST_IMPORT_KEY = 'flux-last-imported-at';
type ImportMode = 'replace' | 'merge';
type MergeConflictStrategy = 'incoming' | 'local';

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
  const [activity, setActivity] = useState<
    { id: string; at: string; action: string; detail?: string }[]
  >([]);
  const [mergeConflictStrategy, setMergeConflictStrategy] = useState<MergeConflictStrategy>('incoming');

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
      setActivity((await listActivity()).slice(0, 8));
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
      await logActivity('export-share-json');
      setActivity((await listActivity()).slice(0, 8));
    } catch {
      Alert.alert('Could not share', 'Try again or copy from a file manager.');
    }
  };

  const onExportCsv = async () => {
    try {
      await Share.share({ message: buildExportCsv(exportPayload()), title: 'Flux backup (CSV)' });
      await saveMeta(LAST_EXPORT_KEY, new Date().toISOString());
      await logActivity('export-share-csv');
      setActivity((await listActivity()).slice(0, 8));
    } catch {
      Alert.alert('Could not share', 'Try again or copy from a file manager.');
    }
  };

  const onExportToFile = async (kind: 'json' | 'csv') => {
    try {
      const base = `flux-backup-${new Date().toISOString().slice(0, 10)}`;
      const fileName = `${base}.${kind}`;
      const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!dir) {
        Alert.alert('File export unavailable', 'No writable directory was found on this device.');
        return;
      }
      const fileUri = `${dir}${fileName}`;
      const content = kind === 'json' ? buildExportJson(exportPayload()) : buildExportCsv(exportPayload());
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: kind === 'json' ? 'application/json' : 'text/csv',
          dialogTitle: `Save Flux backup (${kind.toUpperCase()})`,
        });
      } else {
        await Share.share({ message: fileUri, title: 'Backup file path' });
      }
      await saveMeta(LAST_EXPORT_KEY, new Date().toISOString());
      await logActivity(`export-file-${kind}`);
      setActivity((await listActivity()).slice(0, 8));
    } catch {
      Alert.alert('Could not export file', 'Please try again.');
    }
  };

  const countConflicts = <T extends { id: string }>(current: T[], incoming: T[]) => {
    const localIds = new Set(current.map((x) => x.id));
    return incoming.reduce((acc, x) => (localIds.has(x.id) ? acc + 1 : acc), 0);
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

  const conflictCounts = useMemo(() => {
    if (!preview) return null;
    const current = exportPayload();
    return {
      income: countConflicts(current.incomeStreams, preview.incomeStreams),
      bills: countConflicts(current.billItems, preview.billItems),
      lines: countConflicts(current.lines, preview.lines),
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
      const mergeLocalWins = <T extends { id: string }>(current: T[], incoming: T[]) => {
        const map = new Map<string, T>();
        for (const x of incoming) map.set(x.id, x);
        for (const x of current) map.set(x.id, x);
        return [...map.values()];
      };
      if (mergeConflictStrategy === 'incoming') {
        store.setIncomeStreams(mergeById(s.incomeStreams, preview.incomeStreams));
        store.setBillItems(mergeById(s.billItems, preview.billItems));
        store.setLines(mergeById(s.lines, preview.lines));
      } else {
        store.setIncomeStreams(mergeLocalWins(s.incomeStreams, preview.incomeStreams));
        store.setBillItems(mergeLocalWins(s.billItems, preview.billItems));
        store.setLines(mergeLocalWins(s.lines, preview.lines));
      }
    }
    await saveMeta(LAST_IMPORT_KEY, new Date().toISOString());
    const mergeNote =
      importMode === 'merge' ? ` (${mergeConflictStrategy} wins)` : '';
    await logActivity('import-applied', `${importMode}${mergeNote}`);
    setActivity((await listActivity()).slice(0, 8));
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
        <RNView style={styles.row}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void onExportToFile('json')}
            style={({ pressed }) => [
              styles.btn,
              styles.half,
              { borderColor: palette.borderStrong, backgroundColor: palette.surfaceMuted, opacity: pressed ? 0.9 : 1 },
              hairlineBorder(palette.borderStrong),
            ]}>
            <FontAwesome name="save" size={18} color={palette.tint} />
            <Text style={[styles.btnText, { color: palette.text }]}>Save JSON file</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void onExportToFile('csv')}
            style={({ pressed }) => [
              styles.btn,
              styles.half,
              { borderColor: palette.borderStrong, backgroundColor: palette.surfaceMuted, opacity: pressed ? 0.9 : 1 },
              hairlineBorder(palette.borderStrong),
            ]}>
            <FontAwesome name="save" size={18} color={palette.tint} />
            <Text style={[styles.btnText, { color: palette.text }]}>Save CSV file</Text>
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
              <>
                <Text style={[styles.note, { color: palette.textMuted }]}>
                  After merge: {mergedCounts.income} income streams, {mergedCounts.bills} bills, {mergedCounts.lines} outflows.
                </Text>
                {conflictCounts ? (
                  <Text style={[styles.note, { color: palette.textMuted }]}>
                    ID conflicts: {conflictCounts.income} income, {conflictCounts.bills} bills, {conflictCounts.lines} outflows.
                  </Text>
                ) : null}
                <RNView style={styles.modeRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: mergeConflictStrategy === 'incoming' }}
                    onPress={() => setMergeConflictStrategy('incoming')}
                    style={({ pressed }) => [
                      styles.modeChip,
                      {
                        borderColor: mergeConflictStrategy === 'incoming' ? palette.tint : palette.border,
                        backgroundColor: mergeConflictStrategy === 'incoming' ? palette.tintMuted : palette.surfaceMuted,
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}>
                    <Text style={{ color: mergeConflictStrategy === 'incoming' ? palette.tintStrong : palette.textSecondary, fontWeight: '700' }}>
                      Incoming wins
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: mergeConflictStrategy === 'local' }}
                    onPress={() => setMergeConflictStrategy('local')}
                    style={({ pressed }) => [
                      styles.modeChip,
                      {
                        borderColor: mergeConflictStrategy === 'local' ? palette.tint : palette.border,
                        backgroundColor: mergeConflictStrategy === 'local' ? palette.tintMuted : palette.surfaceMuted,
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}>
                    <Text style={{ color: mergeConflictStrategy === 'local' ? palette.tintStrong : palette.textSecondary, fontWeight: '700' }}>
                      Keep local
                    </Text>
                  </Pressable>
                </RNView>
              </>
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
      <SectionCard title="Recent activity" subtitle="Latest backup and line actions">
        {activity.length === 0 ? (
          <Text style={[styles.note, { color: palette.textMuted }]}>No activity yet.</Text>
        ) : (
          activity.map((entry) => (
            <RNView key={entry.id} style={styles.activityRow}>
              <Text style={{ color: palette.text, fontWeight: '700' }}>{entry.action}</Text>
              <Text style={{ color: palette.textMuted, fontSize: 12 }}>
                {new Date(entry.at).toLocaleString()}
                {entry.detail ? ` · ${entry.detail}` : ''}
              </Text>
            </RNView>
          ))
        )}
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
  activityRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
