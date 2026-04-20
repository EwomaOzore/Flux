import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, View as RNView } from 'react-native';
import { useShallow } from 'zustand/shallow';

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
type MergeSide = 'incoming' | 'local';

type ConflictRow = {
  readonly kind: 'income' | 'bill' | 'line';
  readonly id: string;
  readonly label: string;
};

function conflictKey(kind: ConflictRow['kind'], id: string): string {
  return `${kind}:${id}`;
}

function mergeWithPerSide<T extends { id: string }>(
  local: T[],
  incoming: T[],
  sideForId: (id: string) => MergeSide,
): T[] {
  const localMap = new Map(local.map((x) => [x.id, x]));
  const incomingMap = new Map(incoming.map((x) => [x.id, x]));
  const ids = new Set<string>([...localMap.keys(), ...incomingMap.keys()]);
  const out: T[] = [];
  for (const id of ids) {
    const l = localMap.get(id);
    const r = incomingMap.get(id);
    if (l && r) out.push(sideForId(id) === 'incoming' ? r : l);
    else if (l) out.push(l);
    else if (r) out.push(r);
  }
  return out;
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
  const [defaultMergeSide, setDefaultMergeSide] = useState<MergeSide>('incoming');
  const [conflictOverrides, setConflictOverrides] = useState<Record<string, MergeSide>>({});

  const currentSlice = useBudgetStore(
    useShallow((s) => ({
      incomeStreams: s.incomeStreams,
      billItems: s.billItems,
      lines: s.lines,
    })),
  );

  const exportPayload = () => {
    const s = useBudgetStore.getState();
    return { incomeStreams: s.incomeStreams, billItems: s.billItems, lines: s.lines };
  };

  const sideForConflict = useCallback(
    (kind: ConflictRow['kind'], id: string): MergeSide => {
      const k = conflictKey(kind, id);
      return conflictOverrides[k] ?? defaultMergeSide;
    },
    [conflictOverrides, defaultMergeSide],
  );

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
      setConflictOverrides({});
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not import this file.';
      Alert.alert('Import failed', msg);
    } finally {
      setImporting(false);
    }
  };

  const conflictRows = useMemo((): ConflictRow[] => {
    if (!preview) return [];
    const rows: ConflictRow[] = [];
    for (const x of preview.incomeStreams) {
      if (currentSlice.incomeStreams.some((c) => c.id === x.id)) {
        rows.push({ kind: 'income', id: x.id, label: x.label || x.id });
      }
    }
    for (const x of preview.billItems) {
      if (currentSlice.billItems.some((c) => c.id === x.id)) {
        rows.push({ kind: 'bill', id: x.id, label: x.label || x.id });
      }
    }
    for (const x of preview.lines) {
      if (currentSlice.lines.some((c) => c.id === x.id)) {
        rows.push({ kind: 'line', id: x.id, label: x.label || x.id });
      }
    }
    return rows;
  }, [preview, currentSlice]);

  const mergedCounts = useMemo(() => {
    if (!preview) return null;
    const cur = currentSlice;
    const income = mergeWithPerSide(cur.incomeStreams, preview.incomeStreams, (id) =>
      sideForConflict('income', id),
    );
    const bills = mergeWithPerSide(cur.billItems, preview.billItems, (id) =>
      sideForConflict('bill', id),
    );
    const lines = mergeWithPerSide(cur.lines, preview.lines, (id) =>
      sideForConflict('line', id),
    );
    return { income: income.length, bills: bills.length, lines: lines.length };
  }, [preview, currentSlice, sideForConflict]);

  const applyImport = async () => {
    if (!preview) return;
    const store = useBudgetStore.getState();
    if (importMode === 'replace') {
      store.setIncomeStreams(preview.incomeStreams);
      store.setBillItems(preview.billItems);
      store.setLines(preview.lines);
    } else {
      const s = useBudgetStore.getState();
      store.setIncomeStreams(
        mergeWithPerSide(s.incomeStreams, preview.incomeStreams, (id) =>
          sideForConflict('income', id),
        ),
      );
      store.setBillItems(
        mergeWithPerSide(s.billItems, preview.billItems, (id) =>
          sideForConflict('bill', id),
        ),
      );
      store.setLines(
        mergeWithPerSide(s.lines, preview.lines, (id) =>
          sideForConflict('line', id),
        ),
      );
    }
    await saveMeta(LAST_IMPORT_KEY, new Date().toISOString());
    const overrideCount = Object.keys(conflictOverrides).length;
    const mergeNote =
      importMode === 'merge'
        ? overrideCount > 0
          ? ` (merge, ${overrideCount} per-item)`
          : ` (merge, default ${defaultMergeSide})`
        : '';
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
    setConflictOverrides({});
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
                {conflictRows.length > 0 ? (
                  <>
                    <Text style={[styles.note, { color: palette.textMuted }]}>
                      {conflictRows.length} item
                      {conflictRows.length === 1 ? '' : 's'} with the same ID on this device and in the file. Choose which
                      version to keep for each, or set defaults below.
                    </Text>
                    <RNView style={styles.modeRow}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: defaultMergeSide === 'incoming' }}
                        onPress={() => {
                          setDefaultMergeSide('incoming');
                          setConflictOverrides({});
                        }}
                        style={({ pressed }) => [
                          styles.modeChip,
                          {
                            borderColor:
                              defaultMergeSide === 'incoming' ? palette.tint : palette.border,
                            backgroundColor:
                              defaultMergeSide === 'incoming'
                                ? palette.tintMuted
                                : palette.surfaceMuted,
                            opacity: pressed ? 0.92 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color:
                              defaultMergeSide === 'incoming'
                                ? palette.tintStrong
                                : palette.textSecondary,
                            fontWeight: '700',
                          }}
                        >
                          Default: use file
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: defaultMergeSide === 'local' }}
                        onPress={() => {
                          setDefaultMergeSide('local');
                          setConflictOverrides({});
                        }}
                        style={({ pressed }) => [
                          styles.modeChip,
                          {
                            borderColor:
                              defaultMergeSide === 'local' ? palette.tint : palette.border,
                            backgroundColor:
                              defaultMergeSide === 'local'
                                ? palette.tintMuted
                                : palette.surfaceMuted,
                            opacity: pressed ? 0.92 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color:
                              defaultMergeSide === 'local'
                                ? palette.tintStrong
                                : palette.textSecondary,
                            fontWeight: '700',
                          }}
                        >
                          Default: keep device
                        </Text>
                      </Pressable>
                    </RNView>
                    <ScrollView
                      style={styles.conflictScroll}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {conflictRows.map((row) => {
                        const ck = conflictKey(row.kind, row.id);
                        const picked = sideForConflict(row.kind, row.id);
                        const kindLabel =
                          row.kind === 'income'
                            ? 'Income'
                            : row.kind === 'bill'
                              ? 'Bill'
                              : 'Outflow';
                        return (
                          <RNView
                            key={ck}
                            style={[
                              styles.conflictCard,
                              { borderColor: palette.border, backgroundColor: palette.surfaceMuted },
                              hairlineBorder(palette.border),
                            ]}
                          >
                            <Text style={{ color: palette.textMuted, fontSize: 11, fontWeight: '800' }}>
                              {kindLabel}
                            </Text>
                            <Text style={{ color: palette.text, fontWeight: '700' }} numberOfLines={2}>
                              {row.label}
                            </Text>
                            <RNView style={styles.modeRow}>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityState={{ selected: picked === 'incoming' }}
                                onPress={() =>
                                  setConflictOverrides((o) => ({ ...o, [ck]: 'incoming' }))
                                }
                                style={({ pressed }) => [
                                  styles.modeChip,
                                  {
                                    borderColor:
                                      picked === 'incoming' ? palette.tint : palette.border,
                                    backgroundColor:
                                      picked === 'incoming'
                                        ? palette.tintMuted
                                        : palette.surface,
                                    opacity: pressed ? 0.92 : 1,
                                  },
                                ]}
                              >
                                <Text
                                  style={{
                                    color:
                                      picked === 'incoming'
                                        ? palette.tintStrong
                                        : palette.textSecondary,
                                    fontWeight: '700',
                                  }}
                                >
                                  Use file
                                </Text>
                              </Pressable>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityState={{ selected: picked === 'local' }}
                                onPress={() =>
                                  setConflictOverrides((o) => ({ ...o, [ck]: 'local' }))
                                }
                                style={({ pressed }) => [
                                  styles.modeChip,
                                  {
                                    borderColor:
                                      picked === 'local' ? palette.tint : palette.border,
                                    backgroundColor:
                                      picked === 'local' ? palette.tintMuted : palette.surface,
                                    opacity: pressed ? 0.92 : 1,
                                  },
                                ]}
                              >
                                <Text
                                  style={{
                                    color:
                                      picked === 'local'
                                        ? palette.tintStrong
                                        : palette.textSecondary,
                                    fontWeight: '700',
                                  }}
                                >
                                  Keep device
                                </Text>
                              </Pressable>
                            </RNView>
                          </RNView>
                        );
                      })}
                    </ScrollView>
                  </>
                ) : (
                  <Text style={[styles.note, { color: palette.textMuted }]}>
                    No overlapping IDs — new rows from the file are added and the rest stay as on this device.
                  </Text>
                )}
              </>
            ) : null}
            <RNView style={styles.row}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setPreview(null);
                  setPreviewFileName('');
                  setConflictOverrides({});
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
  conflictScroll: {
    maxHeight: 280,
    marginTop: spacing.sm,
  },
  conflictCard: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  activityRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
