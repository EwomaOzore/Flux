import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { extractTextFromImage, ocrSupported } from '@/src/lib/receiptOcr';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { FluxTextInput, FormField, PrimaryButton, useFluxPalette } from '@/components/ui';
import { MonthPickerField } from '@/components/MonthPickerField';
import { hairlineBorder, radii, spacing } from '@/constants/theme';
import { formatNgn, parseNgnInput } from '@/src/lib/formatCurrency';
import { formatMonthIdDisplay, type MonthId } from '@/src/domain/month';
import { guessReceiptLabelFromText, parseReceiptAmountFromText } from '@/src/lib/parseReceiptText';
import { getLastReceiptLabel, setLastReceiptLabel } from '@/src/lib/receiptPrefs';
import { useBudgetStore } from '@/src/state/budgetStore';

function moneyDraftFromText(text: string): string {
  if (!text.replace(/\D/g, '')) return '';
  return formatNgn(parseNgnInput(text));
}

type Props = {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly month: MonthId;
  readonly onMonthChange: (m: MonthId) => void;
};

export function ReceiptScanSheet(props: Readonly<Props>) {
  const { visible, onClose, month, onMonthChange } = props;
  const insets = useSafeAreaInsets();
  const { palette } = useFluxPalette();
  const addLine = useBudgetStore((s) => s.addLine);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [rawText, setRawText] = useState('');
  const [labelDraft, setLabelDraft] = useState('');
  const [amountDraft, setAmountDraft] = useState('');
  const lastMerchantRef = useRef<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    void getLastReceiptLabel().then((last) => {
      lastMerchantRef.current = last;
      setLabelDraft((prev) => (prev.trim() ? prev : last ?? ''));
    });
  }, [visible]);

  const resetDrafts = useCallback(() => {
    setImageUri(null);
    setRawText('');
    setLabelDraft('');
    setAmountDraft('');
    setOcrBusy(false);
  }, []);

  const handleClose = useCallback(() => {
    resetDrafts();
    onClose();
  }, [onClose, resetDrafts]);

  const applyParsedText = useCallback((fullText: string) => {
    setRawText(fullText);
    const amount = parseReceiptAmountFromText(fullText);
    const guessed = guessReceiptLabelFromText(fullText);
    const label = guessed.trim() || lastMerchantRef.current || '';
    setLabelDraft(label);
    setAmountDraft(amount != null && amount > 0 ? formatNgn(amount) : '');
  }, []);

  const runOcrOnUri = useCallback(
    async (uri: string) => {
      setImageUri(uri);
      setRawText('');
      if (Platform.OS === 'web' || !ocrSupported) {
        return;
      }
      setOcrBusy(true);
      try {
        const chunks = await extractTextFromImage(uri);
        const full = chunks.join('\n').trim();
        if (!full) {
          Alert.alert(
            'No text found',
            'Try a clearer photo, use “Fill from clipboard” if you copied text from the receipt, or type the amount below.',
          );
          return;
        }
        applyParsedText(full);
      } catch {
        Alert.alert('Scan failed', 'Could not read the receipt. Try clipboard or enter details manually.');
      } finally {
        setOcrBusy(false);
      }
    },
    [applyParsedText],
  );

  const introCopy = useMemo(() => {
    if (Platform.OS === 'web') {
      return 'Add a photo for reference. Paste copied receipt text with the button below, or type the amount.';
    }
    if (ocrSupported) {
      return 'Take or choose a photo — we read text on your device and suggest a label and total. You can edit before saving.';
    }
    return 'Expo Go does not include on-device receipt scanning. Add a photo for reference, copy text from the receipt (e.g. iPhone: Photos → Live Text → Copy), then tap Fill from clipboard. Or type the amount. Use a development build for automatic scanning.';
  }, [ocrSupported]);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const has = await Clipboard.hasStringAsync();
      if (!has) {
        Alert.alert(
          'Nothing to paste',
          'Copy text from your receipt first. On iPhone: open the photo in Photos, use Live Text to select all text, then Copy.',
        );
        return;
      }
      const text = (await Clipboard.getStringAsync()).trim();
      if (!text) {
        Alert.alert('Nothing to paste', 'Your clipboard is empty.');
        return;
      }
      applyParsedText(text);
    } catch {
      Alert.alert('Clipboard', 'Could not read the clipboard.');
    }
  }, [applyParsedText]);

  const pickFromCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera access', 'Allow camera access in Settings to scan receipts.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      await runOcrOnUri(res.assets[0].uri);
    }
  }, [runOcrOnUri]);

  const pickFromLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Photos access', 'Allow photo library access to choose a receipt image.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      await runOcrOnUri(res.assets[0].uri);
    }
  }, [runOcrOnUri]);

  const onSave = useCallback((keepOpen: boolean = false) => {
    const amount = parseNgnInput(amountDraft || '0');
    if (amount <= 0) {
      Alert.alert('Amount needed', 'Enter a positive amount from the receipt.');
      return;
    }
    const label = labelDraft.trim() || 'Receipt';
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    void setLastReceiptLabel(label);
    addLine({ month, label, amount });
    Alert.alert(
      'Added',
      `“${label}” for ${formatMonthIdDisplay(month)} was added from your receipt. It will show on Home and Timeline.`,
    );
    if (keepOpen) {
      setImageUri(null);
      setRawText('');
      setAmountDraft('');
      return;
    }
    handleClose();
  }, [addLine, amountDraft, handleClose, labelDraft, month]);

  const monthTriggerStyle = {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    borderColor: palette.borderStrong,
    backgroundColor: palette.surfaceMuted,
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel="Close" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}
          style={[
            styles.sheet,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              paddingBottom: Math.max(insets.bottom, spacing.md),
              maxHeight: '88%',
            },
            hairlineBorder(palette.border),
          ]}>
          <View style={[styles.handleZone, { borderBottomColor: palette.border }]}>
            <View style={[styles.handle, { backgroundColor: palette.borderStrong }]} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.text }]}>Scan receipt</Text>
            <Pressable onPress={handleClose} hitSlop={14} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={{ color: palette.tint, fontSize: 17, fontWeight: '700' }}>Done</Text>
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{introCopy}</Text>

          {ocrSupported ? null : (
            <View style={[styles.tipBox, { backgroundColor: palette.infoMuted, borderColor: palette.border }]}>
              <Text style={[styles.tipTitle, { color: palette.info }]}>
                {Platform.OS === 'web' ? 'Paste receipt text' : 'Quick fill in Expo Go'}
              </Text>
              <Text style={[styles.tipBody, { color: palette.textSecondary }]}>
                {Platform.OS === 'web'
                  ? 'Copy text from your receipt elsewhere, then tap the button below to parse label and amount.'
                  : 'Open the receipt in Photos → use Live Text to select text → Copy → come back here → tap Fill from clipboard.'}
              </Text>
              <Pressable
                onPress={pasteFromClipboard}
                style={({ pressed }) => [
                  styles.clipboardBtn,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.borderStrong,
                    opacity: pressed ? 0.9 : 1,
                  },
                  hairlineBorder(palette.borderStrong),
                ]}>
                <FontAwesome name="paste" size={18} color={palette.tint} />
                <Text style={[styles.clipboardBtnText, { color: palette.text }]}>Fill from clipboard</Text>
              </Pressable>
            </View>
          )}

          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}>
            <View style={styles.actions}>
              <Pressable
                onPress={pickFromCamera}
                disabled={ocrBusy}
                style={({ pressed }) => [
                  styles.actionBtn,
                  monthTriggerStyle,
                  { opacity: pressed || ocrBusy ? 0.85 : 1 },
                ]}>
                <FontAwesome name="camera" size={20} color={palette.tint} />
                <Text style={[styles.actionLabel, { color: palette.text }]}>Camera</Text>
              </Pressable>
              <Pressable
                onPress={pickFromLibrary}
                disabled={ocrBusy}
                style={({ pressed }) => [
                  styles.actionBtn,
                  monthTriggerStyle,
                  { opacity: pressed || ocrBusy ? 0.85 : 1 },
                ]}>
                <FontAwesome name="photo" size={20} color={palette.tint} />
                <Text style={[styles.actionLabel, { color: palette.text }]}>Photo library</Text>
              </Pressable>
            </View>

            {ocrSupported ? (
              <Pressable
                onPress={pasteFromClipboard}
                style={({ pressed }) => [
                  styles.secondaryRow,
                  monthTriggerStyle,
                  { opacity: pressed ? 0.9 : 1 },
                ]}>
                <FontAwesome name="paste" size={18} color={palette.tint} />
                <Text style={[styles.secondaryRowText, { color: palette.text }]}>
                  Or fill from clipboard (copied receipt text)
                </Text>
              </Pressable>
            ) : null}

            {ocrBusy ? (
              <View style={styles.busy}>
                <ActivityIndicator size="large" color={palette.tint} />
                <Text style={[styles.busyText, { color: palette.textMuted }]}>Reading receipt…</Text>
              </View>
            ) : null}

            {imageUri && !ocrBusy ? (
              <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
            ) : null}

            <FormField label="Month for this expense">
              <MonthPickerField value={month} onChange={onMonthChange} palette={palette} triggerStyle={monthTriggerStyle} />
            </FormField>

            <FormField label="Label (editable)">
              <FluxTextInput
                value={labelDraft}
                onChangeText={setLabelDraft}
                placeholder="e.g. Shop name or description"
              />
            </FormField>
            <FormField label="Amount (editable)">
              <FluxTextInput
                value={amountDraft}
                onChangeText={(t) => setAmountDraft(moneyDraftFromText(t))}
                keyboardType="number-pad"
                money
                placeholder="e.g. ₦12,500"
              />
            </FormField>

            {rawText.length > 0 ? (
              <View style={[styles.rawBox, { borderColor: palette.border, backgroundColor: palette.surfaceMuted }]}>
                <Text style={[styles.rawTitle, { color: palette.textMuted }]}>Recognized text</Text>
                <Text style={[styles.rawBody, { color: palette.textSecondary }]} numberOfLines={6}>
                  {rawText}
                </Text>
              </View>
            ) : null}

            <Text style={[styles.privacy, { color: palette.textMuted }]}>
              Receipt images are processed on your device to read text. Flux doesn&apos;t upload your photos to our
              servers for OCR. You can delete the photo from your library anytime.
            </Text>

            <PrimaryButton label="Add to payday outflows" onPress={() => onSave(false)} />
            <Pressable
              accessibilityRole="button"
              onPress={() => onSave(true)}
              style={({ pressed }) => [
                styles.addAnotherBtn,
                monthTriggerStyle,
                { opacity: pressed ? 0.9 : 1 },
              ]}>
              <Text style={[styles.addAnotherText, { color: palette.text }]}>Save and add another</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000055',
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    overflow: 'hidden',
  },
  handleZone: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  tipBox: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  tipBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  clipboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  clipboardBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  secondaryRowText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingVertical: 14,
    borderRadius: radii.md,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  busy: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  busyText: {
    fontSize: 14,
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: radii.md,
    backgroundColor: '#00000014',
  },
  rawBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  rawTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  rawBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  privacy: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  addAnotherBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  addAnotherText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
