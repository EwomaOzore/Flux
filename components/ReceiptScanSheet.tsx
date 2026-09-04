import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FluxBottomSheet,
  FluxBottomSheetHeader,
} from "@/components/FluxBottomSheet";
import { MonthPickerField } from "@/components/MonthPickerField";
import { Text } from "@/components/Themed";
import {
  FluxTextInput,
  FormField,
  PrimaryButton,
  useFluxPalette,
} from "@/components/ui";
import { spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import { formatMonthIdDisplay, type MonthId } from "@/src/domain/month";
import {
  formatMoney,
  parseMoneyInput,
  sampleMoneyPlaceholder,
} from "@/src/lib/formatCurrency";
import {
  guessReceiptLabelFromText,
  parseReceiptAmountFromText,
} from "@/src/lib/parseReceiptText";
import { extractTextFromImage, ocrSupported } from "@/src/lib/receiptOcr";
import {
  getLastReceiptLabel,
  setLastReceiptLabel,
} from "@/src/lib/receiptPrefs";
import { useBudgetStore } from "@/src/state/budgetStore";

const CARD_BORDER = "#E0DAD3";

function moneyDraftFromText(text: string): string {
  if (!text.replace(/\D/g, "")) return "";
  return formatMoney(parseMoneyInput(text));
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
  const { palette, colorScheme } = useFluxPalette();
  const dark = colorScheme === "dark";
  const borderColor = dark ? palette.cardBorder : CARD_BORDER;
  const accent = dark ? "#48B872" : "#2B7A50";
  const mutedColor = dark ? "#B0A89E" : "#5A5349";
  const addLine = useBudgetStore((s) => s.addLine);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [rawText, setRawText] = useState("");
  const [labelDraft, setLabelDraft] = useState("");
  const [amountDraft, setAmountDraft] = useState("");
  const lastMerchantRef = useRef<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    void getLastReceiptLabel().then((last) => {
      lastMerchantRef.current = last;
      setLabelDraft((prev) => (prev.trim() ? prev : (last ?? "")));
    });
  }, [visible]);

  const resetDrafts = useCallback(() => {
    setImageUri(null);
    setRawText("");
    setLabelDraft("");
    setAmountDraft("");
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
    const label = guessed.trim() || lastMerchantRef.current || "";
    setLabelDraft(label);
    setAmountDraft(amount != null && amount > 0 ? formatMoney(amount) : "");
  }, []);

  const runOcrOnUri = useCallback(
    async (uri: string) => {
      setImageUri(uri);
      setRawText("");
      if (Platform.OS === "web" || !ocrSupported) {
        return;
      }
      setOcrBusy(true);
      try {
        const chunks = await extractTextFromImage(uri);
        const full = chunks.join("\n").trim();
        if (!full) {
          Alert.alert(
            "No text found",
            'Try a clearer photo, use "Fill from clipboard" if you copied text from the receipt, or type the amount below.',
          );
          return;
        }
        applyParsedText(full);
      } catch {
        Alert.alert(
          "Scan failed",
          "Could not read the receipt. Try clipboard or enter details manually.",
        );
      } finally {
        setOcrBusy(false);
      }
    },
    [applyParsedText],
  );

  const introCopy = useMemo(() => {
    if (Platform.OS === "web") {
      return "Add a photo for reference. Paste copied receipt text with the button below, or type the amount.";
    }
    if (ocrSupported) {
      return "Take or choose a photo — we read text on your device and suggest a label and total. You can edit before saving.";
    }
    return "Expo Go does not include on-device receipt scanning. Add a photo for reference, copy text from the receipt (e.g. iPhone: Photos → Live Text → Copy), then tap Fill from clipboard. Or type the amount. Use a development build for automatic scanning.";
  }, [ocrSupported]);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const has = await Clipboard.hasStringAsync();
      if (!has) {
        Alert.alert(
          "Nothing to paste",
          "Copy text from your receipt first. On iPhone: open the photo in Photos, use Live Text to select all text, then Copy.",
        );
        return;
      }
      const text = (await Clipboard.getStringAsync()).trim();
      if (!text) {
        Alert.alert("Nothing to paste", "Your clipboard is empty.");
        return;
      }
      applyParsedText(text);
    } catch {
      Alert.alert("Clipboard", "Could not read the clipboard.");
    }
  }, [applyParsedText]);

  const pickFromCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera access",
        "Allow camera access in Settings to scan receipts.",
      );
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      await runOcrOnUri(res.assets[0].uri);
    }
  }, [runOcrOnUri]);

  const pickFromLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Photos access",
        "Allow photo library access to choose a receipt image.",
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      await runOcrOnUri(res.assets[0].uri);
    }
  }, [runOcrOnUri]);

  const onSave = useCallback(
    (keepOpen: boolean = false) => {
      const amount = parseMoneyInput(amountDraft || "0");
      if (amount <= 0) {
        Alert.alert(
          "Amount needed",
          "Enter a positive amount from the receipt.",
        );
        return;
      }
      const label = labelDraft.trim() || "Receipt";
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      void setLastReceiptLabel(label);
      addLine({ month, label, amount });
      Alert.alert(
        "Added",
        `"${label}" for ${formatMonthIdDisplay(month)} was added from your receipt. Open Plan or Timeline for that month to see it.`,
      );
      if (keepOpen) {
        setImageUri(null);
        setRawText("");
        setAmountDraft("");
        return;
      }
      handleClose();
    },
    [addLine, amountDraft, handleClose, labelDraft, month],
  );

  const whiteFieldStyle = {
    borderWidth: 1,
    borderRadius: 14,
    borderColor,
    backgroundColor: palette.inputBackground,
  };

  const fieldInk = palette.inputText;

  const inputOverride = {
    ...whiteFieldStyle,
    color: fieldInk,
    fontFamily: typeface.regular,
    fontSize: 15,
  };

  const moneyInputOverride = {
    ...inputOverride,
    fontFamily: typeface.mono,
  };

  return (
    <FluxBottomSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={["88%"]}
    >
      <FluxBottomSheetHeader
        title="Scan receipt"
        onClose={handleClose}
        subtitle={introCopy}
      />

      {ocrSupported ? null : (
        <View
          style={[
            styles.tipBox,
            { backgroundColor: palette.inputBackground, borderColor },
          ]}
        >
          <Text style={[styles.tipTitle, { color: mutedColor }]}>
            {Platform.OS === "web"
              ? "Paste receipt text"
              : "Quick fill in Expo Go"}
          </Text>
          <Text style={[styles.tipBody, { color: mutedColor }]}>
            {Platform.OS === "web"
              ? "Copy text from your receipt elsewhere, then tap the button below to parse label and amount."
              : "Open the receipt in Photos → use Live Text to select text → Copy → come back here → tap Fill from clipboard."}
          </Text>
          <Pressable
            onPress={pasteFromClipboard}
            style={({ pressed }) => [
              styles.clipboardBtn,
              whiteFieldStyle,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <FontAwesome name="paste" size={18} color={accent} />
            <Text style={[styles.clipboardBtnText, { color: fieldInk }]}>
              Fill from clipboard
            </Text>
          </Pressable>
        </View>
      )}

      <View
        style={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) },
        ]}
      >
        <View style={styles.actions}>
          <Pressable
            onPress={pickFromCamera}
            disabled={ocrBusy}
            style={({ pressed }) => [
              styles.actionBtn,
              whiteFieldStyle,
              { opacity: pressed || ocrBusy ? 0.85 : 1 },
            ]}
          >
            <FontAwesome name="camera" size={20} color={accent} />
            <Text style={[styles.actionLabel, { color: fieldInk }]}>
              Camera
            </Text>
          </Pressable>
          <Pressable
            onPress={pickFromLibrary}
            disabled={ocrBusy}
            style={({ pressed }) => [
              styles.actionBtn,
              whiteFieldStyle,
              { opacity: pressed || ocrBusy ? 0.85 : 1 },
            ]}
          >
            <FontAwesome name="photo" size={20} color={accent} />
            <Text style={[styles.actionLabel, { color: fieldInk }]}>
              Photo library
            </Text>
          </Pressable>
        </View>

        {ocrSupported ? (
          <Pressable
            onPress={pasteFromClipboard}
            style={({ pressed }) => [
              styles.secondaryRow,
              whiteFieldStyle,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <FontAwesome name="paste" size={18} color={accent} />
            <Text style={[styles.secondaryRowText, { color: fieldInk }]}>
              Or fill from clipboard (copied receipt text)
            </Text>
          </Pressable>
        ) : null}

        {ocrBusy ? (
          <View style={styles.busy}>
            <ActivityIndicator size="large" color={accent} />
            <Text style={[styles.busyText, { color: mutedColor }]}>
              Reading receipt…
            </Text>
          </View>
        ) : null}

        {imageUri && !ocrBusy ? (
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.preview,
              { borderColor, backgroundColor: palette.inputBackground },
            ]}
            resizeMode="contain"
          />
        ) : null}

        <FormField label="Month for this expense">
          <MonthPickerField
            value={month}
            onChange={onMonthChange}
            palette={palette}
            triggerStyle={whiteFieldStyle}
          />
        </FormField>

        <FormField label="Label (editable)">
          <FluxTextInput
            sheet
            value={labelDraft}
            onChangeText={setLabelDraft}
            placeholder="e.g. Shop name or description"
            placeholderTextColor={mutedColor}
            style={inputOverride}
          />
        </FormField>
        <FormField label="Amount (editable)">
          <FluxTextInput
            sheet
            value={amountDraft}
            onChangeText={(t) => setAmountDraft(moneyDraftFromText(t))}
            keyboardType="number-pad"
            money
            placeholder={`e.g. ${sampleMoneyPlaceholder(12500)}`}
            placeholderTextColor={mutedColor}
            style={moneyInputOverride}
          />
        </FormField>

        {rawText.length > 0 ? (
          <View
            style={[
              styles.rawBox,
              {
                borderColor,
                backgroundColor: palette.inputBackground,
              },
            ]}
          >
            <Text style={[styles.rawTitle, { color: mutedColor }]}>
              Recognized text
            </Text>
            <Text
              style={[styles.rawBody, { color: mutedColor }]}
              numberOfLines={6}
            >
              {rawText}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.privacy, { color: mutedColor }]}>
          Receipt images are processed on your device to read text. Flux
          doesn&apos;t upload your photos to our servers for OCR. You can delete
          the photo from your library anytime.
        </Text>

        <PrimaryButton
          label="Add to payday outflows"
          onPress={() => onSave(false)}
          style={{ backgroundColor: accent, borderRadius: 14 }}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => onSave(true)}
          style={({ pressed }) => [
            styles.addAnotherBtn,
            whiteFieldStyle,
            { opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={[styles.addAnotherText, { color: accent }]}>
            Save and add another
          </Text>
        </Pressable>
      </View>
    </FluxBottomSheet>
  );
}

const styles = StyleSheet.create({
  tipBox: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    gap: spacing.sm,
  },
  tipTitle: {
    fontFamily: typeface.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  tipBody: {
    fontFamily: typeface.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  clipboardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 12,
  },
  clipboardBtnText: {
    fontFamily: typeface.bold,
    fontSize: 15,
  },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  secondaryRowText: {
    fontFamily: typeface.regular,
    fontSize: 14,
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: 48,
    paddingVertical: 14,
  },
  actionLabel: {
    fontFamily: typeface.bold,
    fontSize: 15,
  },
  busy: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  busyText: {
    fontFamily: typeface.regular,
    fontSize: 14,
  },
  preview: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    borderWidth: 1,
  },
  rawBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
  },
  rawTitle: {
    fontFamily: typeface.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  rawBody: {
    fontFamily: typeface.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  privacy: {
    fontFamily: typeface.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  addAnotherBtn: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  addAnotherText: {
    fontFamily: typeface.bold,
    fontSize: 15,
  },
});
