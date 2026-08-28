import { CurrencyPickerList } from "@/components/CurrencyPickerList";
import {
  FluxBottomSheet,
  FluxBottomSheetHeader,
} from "@/components/FluxBottomSheet";
import { Text } from "@/components/Themed";
import { ScreenScroll, useFluxPalette } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import { notifyBiometricPrefsChanged } from "@/src/lib/biometricEvents";
import {
  loadBiometricLockEnabled,
  saveBiometricLockEnabled,
} from "@/src/lib/biometricPrefs";
import { currencyOption } from "@/src/lib/currencies";
import {
  applyReminderPrefs,
  defaultReminderPrefs,
  loadReminderPrefs,
  type ReminderPrefs,
} from "@/src/lib/paydayReminders";
import { useAppearanceStore } from "@/src/state/appearanceStore";
import { useCurrencyStore } from "@/src/state/currencyStore";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Constants from "expo-constants";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  View as RNView,
  StyleSheet,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CARD_BORDER_LIGHT = "#E0DAD3";
const brandLogo = require("../../assets/images/icon.png");

export default function SettingsScreen() {
  const { palette, colorScheme } = useFluxPalette();
  const dark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [reminderPrefs, setReminderPrefs] =
    useState<ReminderPrefs>(defaultReminderPrefs);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [currencySheetOpen, setCurrencySheetOpen] = useState(false);
  const currencyCode = useCurrencyStore((s) => s.currencyCode);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const currency = currencyOption(currencyCode);
  const appearance = useAppearanceStore((s) => s.preference);
  const setAppearance = useAppearanceStore((s) => s.setPreference);
  const darkModeOn = appearance === "dark";

  const accent = dark ? "#48B872" : "#2B7A50";
  const cardBorder = dark ? palette.cardBorder : CARD_BORDER_LIGHT;
  const cardBg = dark ? palette.inputBackground : "#FFFFFF";
  const iconBg = dark ? "#2A2520" : palette.surfaceMuted;
  const rowDivider = cardBorder;

  useEffect(() => {
    loadReminderPrefs()
      .then(setReminderPrefs)
      .catch(() => {});
    void loadBiometricLockEnabled()
      .then(setBiometricEnabled)
      .catch(() => {});
  }, []);

  const onBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert(
          "Not available",
          "This device does not support biometric authentication.",
        );
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert(
          "Set up biometrics",
          "Add Face ID, Touch ID, or a device PIN in system settings first.",
        );
        return;
      }
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "Enable biometric lock for Flux",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });
      if (!res.success) return;
      await saveBiometricLockEnabled(true);
      setBiometricEnabled(true);
      notifyBiometricPrefsChanged();
    } else {
      await saveBiometricLockEnabled(false);
      setBiometricEnabled(false);
      notifyBiometricPrefsChanged();
    }
  };

  const onReminderToggle = async (enabled: boolean) => {
    const next = { ...reminderPrefs, enabled };
    setReminderPrefs(next);
    const ok = await applyReminderPrefs(next);
    if (enabled && !ok) {
      setReminderPrefs((p) => ({ ...p, enabled: false }));
      Alert.alert(
        "Notifications off",
        "Allow notifications for Flux in system settings to get payday reminders.",
      );
    }
  };

  const onReminderDayChange = async (nextDay: number) => {
    const day = Math.max(1, Math.min(28, nextDay));
    const next = { ...reminderPrefs, dayOfMonth: day };
    setReminderPrefs(next);
    await applyReminderPrefs(next);
  };

  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

  return (
    <ScreenScroll>
      <RNView style={{ height: insets.top }} />
      <RNView style={styles.titleRow}>
        <Image source={brandLogo} style={styles.brandLogo} />
        <Text style={[styles.title, { color: palette.text }]}>Settings</Text>
      </RNView>

      <SettingsGroup title="DISPLAY" palette={palette}>
        <RNView
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => setCurrencySheetOpen(true)}
            style={({ pressed }) => [
              styles.row,
              {
                borderBottomWidth: 1,
                borderBottomColor: rowDivider,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <RNView style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <Text style={[styles.currencyGlyph, { color: palette.text }]}>
                {currency.symbol}
              </Text>
            </RNView>
            <RNView style={styles.textCol}>
              <Text style={[styles.rowTitle, { color: palette.text }]}>
                Currency
              </Text>
              <Text style={[styles.rowSub, { color: palette.textMuted }]}>
                {currency.label}
              </Text>
            </RNView>
            <Text style={[styles.code, { color: accent }]}>
              {currency.code}
            </Text>
            <FontAwesome
              name="chevron-right"
              size={12}
              color={palette.textMuted}
            />
          </Pressable>

          <RNView style={styles.row}>
            <RNView style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <FontAwesome
                name="moon-o"
                size={16}
                color={palette.textSecondary}
              />
            </RNView>
            <RNView style={styles.textCol}>
              <Text style={[styles.rowTitle, { color: palette.text }]}>
                Dark mode
              </Text>
              <Text style={[styles.rowSub, { color: palette.textMuted }]}>
                {darkModeOn ? "On" : appearance === "system" ? "System" : "Off"}
              </Text>
            </RNView>
            <Switch
              accessibilityLabel="Toggle dark mode"
              value={darkModeOn}
              onValueChange={(on) => setAppearance(on ? "dark" : "light")}
              trackColor={{ false: palette.border, true: accent }}
              thumbColor="#FFFFFF"
            />
          </RNView>
        </RNView>
      </SettingsGroup>

      <SettingsGroup title="SECURITY" palette={palette}>
        <RNView
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <RNView style={styles.row}>
            <RNView style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <FontAwesome
                name="lock"
                size={16}
                color={palette.textSecondary}
              />
            </RNView>
            <RNView style={styles.textCol}>
              <Text style={[styles.rowTitle, { color: palette.text }]}>
                Biometric lock
              </Text>
              <Text style={[styles.rowSub, { color: palette.textMuted }]}>
                Face ID / Fingerprint
              </Text>
            </RNView>
            <Switch
              accessibilityLabel="Toggle biometric lock"
              value={biometricEnabled}
              onValueChange={(v) => void onBiometricToggle(v)}
              trackColor={{ false: palette.border, true: accent }}
              thumbColor="#FFFFFF"
            />
          </RNView>
        </RNView>
      </SettingsGroup>

      <SettingsGroup title="NOTIFICATIONS" palette={palette}>
        <RNView
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <RNView
            style={[
              styles.row,
              reminderPrefs.enabled && {
                borderBottomWidth: 1,
                borderBottomColor: rowDivider,
              },
            ]}
          >
            <RNView style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <FontAwesome
                name="bell-o"
                size={16}
                color={palette.textSecondary}
              />
            </RNView>
            <RNView style={styles.textCol}>
              <Text style={[styles.rowTitle, { color: palette.text }]}>
                Payday reminders
              </Text>
              <Text style={[styles.rowSub, { color: palette.textMuted }]}>
                Notify on the {reminderPrefs.dayOfMonth}
                {ordinal(reminderPrefs.dayOfMonth)}
              </Text>
            </RNView>
            <Switch
              accessibilityLabel="Toggle payday reminder"
              value={reminderPrefs.enabled}
              onValueChange={(v) => void onReminderToggle(v)}
              trackColor={{ false: palette.border, true: accent }}
              thumbColor="#FFFFFF"
            />
          </RNView>
          {reminderPrefs.enabled ? (
            <RNView style={styles.row}>
              <RNView style={styles.textCol}>
                <Text style={[styles.rowTitle, { color: palette.text }]}>
                  Day of month
                </Text>
              </RNView>
              <RNView style={styles.stepper}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    void onReminderDayChange(reminderPrefs.dayOfMonth - 1)
                  }
                  style={[
                    styles.stepperBtn,
                    {
                      borderColor: cardBorder,
                      backgroundColor: iconBg,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: palette.text,
                      fontFamily: typeface.bold,
                      fontSize: 16,
                    }}
                  >
                    −
                  </Text>
                </Pressable>
                <Text style={[styles.stepperValue, { color: palette.text }]}>
                  {reminderPrefs.dayOfMonth}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    void onReminderDayChange(reminderPrefs.dayOfMonth + 1)
                  }
                  style={[
                    styles.stepperBtn,
                    {
                      borderColor: cardBorder,
                      backgroundColor: iconBg,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: palette.text,
                      fontFamily: typeface.bold,
                      fontSize: 16,
                    }}
                  >
                    +
                  </Text>
                </Pressable>
              </RNView>
            </RNView>
          ) : null}
        </RNView>
      </SettingsGroup>

      <SettingsGroup title="DATA" palette={palette}>
        <RNView
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <RNView
            style={[
              styles.row,
              {
                borderBottomWidth: 1,
                borderBottomColor: rowDivider,
              },
            ]}
          >
            <RNView style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <FontAwesome
                name="download"
                size={16}
                color={palette.textSecondary}
              />
            </RNView>
            <RNView style={styles.textCol}>
              <Text style={[styles.rowTitle, { color: palette.text }]}>
                Export data
              </Text>
              <Text style={[styles.rowSub, { color: palette.textMuted }]}>
                CSV of all records
              </Text>
            </RNView>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/backup")}
              style={[
                styles.actionChip,
                {
                  backgroundColor: dark
                    ? "rgba(72,184,114,0.16)"
                    : palette.tintMuted,
                },
              ]}
            >
              <Text style={[styles.actionChipText, { color: accent }]}>
                Export
              </Text>
            </Pressable>
          </RNView>
          <RNView style={styles.row}>
            <RNView style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <FontAwesome
                name="upload"
                size={16}
                color={palette.textSecondary}
              />
            </RNView>
            <RNView style={styles.textCol}>
              <Text style={[styles.rowTitle, { color: palette.text }]}>
                Import backup
              </Text>
              <Text style={[styles.rowSub, { color: palette.textMuted }]}>
                Restore from export
              </Text>
            </RNView>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/backup")}
              style={[styles.actionChip, { backgroundColor: iconBg }]}
            >
              <Text
                style={[
                  styles.actionChipText,
                  { color: palette.textSecondary },
                ]}
              >
                Import
              </Text>
            </Pressable>
          </RNView>
        </RNView>
      </SettingsGroup>

      <SettingsGroup title="ABOUT" palette={palette}>
        <RNView
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <RNView
            style={[
              styles.row,
              {
                borderBottomWidth: 1,
                borderBottomColor: rowDivider,
              },
            ]}
          >
            <Text style={[styles.aboutLabel, { color: palette.text }]}>
              Version
            </Text>
            <Text style={[styles.aboutValue, { color: palette.textMuted }]}>
              {version}
            </Text>
          </RNView>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/privacy")}
            style={({ pressed }) => [
              styles.row,
              {
                borderBottomWidth: 1,
                borderBottomColor: rowDivider,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Text style={[styles.aboutLabel, { color: palette.text }]}>
              Privacy policy
            </Text>
            <FontAwesome
              name="chevron-right"
              size={12}
              color={palette.textMuted}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/modal")}
            style={({ pressed }) => [
              styles.row,
              { opacity: pressed ? 0.92 : 1 },
            ]}
          >
            <Text style={[styles.aboutLabel, { color: palette.text }]}>
              About Flux
            </Text>
            <FontAwesome
              name="chevron-right"
              size={12}
              color={palette.textMuted}
            />
          </Pressable>
        </RNView>
      </SettingsGroup>

      <Text style={[styles.footerNote, { color: palette.textMuted }]}>
        Your data stays on your device. Always.
      </Text>

      <FluxBottomSheet
        visible={currencySheetOpen}
        onClose={() => setCurrencySheetOpen(false)}
        snapPoints={["75%"]}
      >
        <FluxBottomSheetHeader
          title="Currency"
          onClose={() => setCurrencySheetOpen(false)}
          subtitle="All amounts in Flux will use the currency you pick."
        />
        <CurrencyPickerList
          selected={currencyCode}
          onSelect={(code) => {
            setCurrency(code);
            setCurrencySheetOpen(false);
          }}
        />
      </FluxBottomSheet>
    </ScreenScroll>
  );
}

function SettingsGroup({
  title,
  children,
  palette,
}: Readonly<{
  title: string;
  children: React.ReactNode;
  palette: ReturnType<typeof useFluxPalette>["palette"];
}>) {
  return (
    <RNView style={styles.group}>
      <Text style={[styles.groupTitle, { color: palette.textMuted }]}>
        {title}
      </Text>
      {children}
    </RNView>
  );
}

function ordinal(n: number) {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  brandLogo: {
    width: 24,
    height: 24,
  },
  title: {
    fontFamily: typeface.displayRegular,
    fontSize: 18,
    lineHeight: 18,
    letterSpacing: -0.45,
    marginTop: 5,
  },
  group: {
    gap: spacing.sm,
  },
  groupTitle: {
    fontFamily: typeface.bold,
    fontSize: 11,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  currencyGlyph: {
    fontFamily: typeface.currency,
    fontSize: 16,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: typeface.regular,
    fontSize: 16,
  },
  rowSub: {
    fontFamily: typeface.regular,
    marginTop: 2,
    fontSize: 13,
  },
  code: {
    fontFamily: typeface.mono,
    fontSize: 14,
    marginRight: 4,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontFamily: typeface.monoBold,
    fontSize: 16,
    minWidth: 24,
    textAlign: "center",
  },
  actionChip: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionChipText: {
    fontFamily: typeface.regular,
    fontSize: 13,
  },
  aboutLabel: {
    flex: 1,
    fontFamily: typeface.regular,
    fontSize: 16,
  },
  aboutValue: {
    fontFamily: typeface.mono,
    fontSize: 15,
  },
  footerNote: {
    fontFamily: typeface.regular,
    textAlign: "center",
    fontSize: 13,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
});
