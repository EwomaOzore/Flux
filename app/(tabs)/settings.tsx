import FontAwesome from "@expo/vector-icons/FontAwesome";
import Constants from "expo-constants";
import * as LocalAuthentication from "expo-local-authentication";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  View as RNView,
  StyleSheet,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandMark } from "@/components/BrandMark";
import { CurrencyPickerList } from "@/components/CurrencyPickerList";
import {
  FluxBottomSheet,
  FluxBottomSheetHeader,
} from "@/components/FluxBottomSheet";
import { Text } from "@/components/Themed";
import { ScreenScroll, useFluxPalette } from "@/components/ui";
import { cardElevation, radii, spacing } from "@/constants/theme";
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

export default function SettingsScreen() {
  const { palette, colorScheme } = useFluxPalette();
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
        <BrandMark size={28} />
        <Text style={[styles.title, { color: palette.text }]}>Settings</Text>
      </RNView>

      <SettingsGroup title="DISPLAY" palette={palette}>
        <RNView
          style={[
            styles.card,
            { backgroundColor: palette.surface },
            cardElevation(colorScheme),
          ]}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => setCurrencySheetOpen(true)}
            style={({ pressed }) => [
              styles.row,
              {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: palette.border,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <RNView
              style={[
                styles.iconWrap,
                { backgroundColor: palette.surfaceMuted },
              ]}
            >
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
            <Text style={[styles.code, { color: palette.tint }]}>
              {currency.code}
            </Text>
            <FontAwesome
              name="chevron-right"
              size={12}
              color={palette.textMuted}
            />
          </Pressable>

          <RNView style={styles.row}>
            <RNView
              style={[
                styles.iconWrap,
                { backgroundColor: palette.surfaceMuted },
              ]}
            >
              <FontAwesome name="moon-o" size={16} color={palette.textSecondary} />
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
              trackColor={{ false: palette.border, true: palette.tint }}
              thumbColor="#fff"
            />
          </RNView>
        </RNView>
      </SettingsGroup>

      <SettingsGroup title="SECURITY" palette={palette}>
        <RNView
          style={[
            styles.card,
            { backgroundColor: palette.surface },
            cardElevation(colorScheme),
          ]}
        >
          <RNView style={styles.row}>
            <RNView
              style={[
                styles.iconWrap,
                { backgroundColor: palette.surfaceMuted },
              ]}
            >
              <FontAwesome name="lock" size={16} color={palette.textSecondary} />
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
              trackColor={{ false: palette.border, true: palette.tint }}
              thumbColor="#fff"
            />
          </RNView>
        </RNView>
      </SettingsGroup>

      <SettingsGroup title="NOTIFICATIONS" palette={palette}>
        <RNView
          style={[
            styles.card,
            { backgroundColor: palette.surface },
            cardElevation(colorScheme),
          ]}
        >
          <RNView
            style={[
              styles.row,
              reminderPrefs.enabled && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: palette.border,
              },
            ]}
          >
            <RNView
              style={[
                styles.iconWrap,
                { backgroundColor: palette.surfaceMuted },
              ]}
            >
              <FontAwesome name="bell-o" size={16} color={palette.textSecondary} />
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
              trackColor={{ false: palette.border, true: palette.tint }}
              thumbColor="#fff"
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
                      borderColor: palette.border,
                      backgroundColor: palette.surfaceMuted,
                    },
                  ]}
                >
                  <Text style={{ color: palette.text, fontWeight: "700" }}>
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
                      borderColor: palette.border,
                      backgroundColor: palette.surfaceMuted,
                    },
                  ]}
                >
                  <Text style={{ color: palette.text, fontWeight: "700" }}>
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
            { backgroundColor: palette.surface },
            cardElevation(colorScheme),
          ]}
        >
          <RNView
            style={[
              styles.row,
              {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: palette.border,
              },
            ]}
          >
            <RNView
              style={[
                styles.iconWrap,
                { backgroundColor: palette.surfaceMuted },
              ]}
            >
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
                { backgroundColor: palette.tintMuted },
              ]}
            >
              <Text style={{ color: palette.tint, fontWeight: "700" }}>
                Export
              </Text>
            </Pressable>
          </RNView>
          <RNView style={styles.row}>
            <RNView
              style={[
                styles.iconWrap,
                { backgroundColor: palette.surfaceMuted },
              ]}
            >
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
              style={[
                styles.actionChip,
                { backgroundColor: palette.surfaceMuted },
              ]}
            >
              <Text style={{ color: palette.textSecondary, fontWeight: "700" }}>
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
            { backgroundColor: palette.surface },
            cardElevation(colorScheme),
          ]}
        >
          <Link href="/modal" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.row,
                { opacity: pressed ? 0.92 : 1 },
              ]}
            >
              <RNView
                style={[
                  styles.iconWrap,
                  { backgroundColor: palette.surfaceMuted },
                ]}
              >
                <FontAwesome
                  name="info"
                  size={16}
                  color={palette.textSecondary}
                />
              </RNView>
              <RNView style={styles.textCol}>
                <Text style={[styles.rowTitle, { color: palette.text }]}>
                  About Flux
                </Text>
                <Text style={[styles.rowSub, { color: palette.textMuted }]}>
                  How cushion and payday planning works
                </Text>
              </RNView>
              <FontAwesome
                name="chevron-right"
                size={12}
                color={palette.textMuted}
              />
            </Pressable>
          </Link>
        </RNView>
      </SettingsGroup>

      <Text style={[styles.version, { color: palette.textMuted }]}>
        {version}
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
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: typeface.display,
    fontSize: 32,
    letterSpacing: -0.6,
  },
  group: {
    gap: spacing.sm,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
  card: {
    borderRadius: radii.xl,
    overflow: "hidden",
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
    borderRadius: radii.sm,
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
    fontSize: 16,
    fontWeight: "600",
  },
  rowSub: {
    marginTop: 2,
    fontSize: 13,
  },
  code: {
    fontFamily: typeface.displayMedium,
    fontSize: 14,
    fontWeight: "600",
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
    borderWidth: StyleSheet.hairlineWidth,
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
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    marginTop: spacing.sm,
  },
});
