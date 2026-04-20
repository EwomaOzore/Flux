import * as LocalAuthentication from "expo-local-authentication";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  type AppStateStatus,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/Themed";
import { useFluxPalette } from "@/components/ui";
import { radii, spacing } from "@/constants/theme";
import { loadBiometricLockEnabled } from "@/src/lib/biometricPrefs";
import { subscribeBiometricPrefsChanged } from "@/src/lib/biometricEvents";

type Props = {
  readonly children: ReactNode;
};

export function BiometricGate({ children }: Props) {
  const { palette } = useFluxPalette();
  const insets = useSafeAreaInsets();
  const appState = useRef(AppState.currentState);
  const isFirstHydration = useRef(true);
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);

  const refreshPrefs = useCallback(() => {
    void loadBiometricLockEnabled()
      .then((on) => {
        setEnabled(on);
        if (!on) {
          setLocked(false);
          isFirstHydration.current = false;
          return;
        }
        if (isFirstHydration.current) {
          setLocked(true);
          isFirstHydration.current = false;
        } else {
          setLocked(false);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshPrefs();
    return subscribeBiometricPrefsChanged(refreshPrefs);
  }, [refreshPrefs]);

  const promptUnlock = useCallback(async () => {
    if (!enabled) return;
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      setLocked(false);
      return;
    }
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      setLocked(false);
      return;
    }
    setBusy(true);
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Flux",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });
      if (res.success) setLocked(false);
    } finally {
      setBusy(false);
    }
  }, [enabled]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;
      if (!enabled) return;
      if (prev === "active" && next.match(/inactive|background/)) {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, [enabled]);

  if (!enabled) {
    return <>{children}</>;
  }

  if (locked) {
    return (
      <View
        style={[
          styles.overlay,
          {
            flex: 1,
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
            backgroundColor: palette.background,
          },
        ]}
      >
        <Text style={[styles.title, { color: palette.text }]}>
          {Platform.OS === "ios" ? "Face ID" : "Biometric"} lock
        </Text>
        <Text style={[styles.sub, { color: palette.textMuted }]}>
          Authenticate to continue.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Unlock with biometrics"
          disabled={busy}
          onPress={() => void promptUnlock()}
          style={({ pressed }) => [
            styles.btn,
            {
              borderColor: palette.tint,
              backgroundColor: palette.tintMuted,
              opacity: pressed ? 0.88 : busy ? 0.6 : 1,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={palette.tintStrong} />
          ) : (
            <Text style={[styles.btnText, { color: palette.tintStrong }]}>
              Unlock
            </Text>
          )}
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  btn: {
    minWidth: 200,
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 17,
    fontWeight: "800",
  },
});
