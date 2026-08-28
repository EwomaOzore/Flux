import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from "@expo-google-fonts/instrument-sans";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Updates from "expo-updates";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BiometricGate } from "@/components/BiometricGate";
import { CurrencyOnboardingRedirect } from "@/components/CurrencyOnboardingRedirect";
import { UndoBanner } from "@/components/UndoBanner";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { navigationFonts } from "@/constants/typography";
import { syncReminderFromStorage } from "@/src/lib/paydayReminders";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 0,
  fade: false,
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function ReminderBootstrap() {
  useEffect(() => {
    void syncReminderFromStorage();
  }, []);
  return null;
}

function RootLayoutNav() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const navigationTheme = useMemo(() => {
    const p = Colors[colorScheme ?? "light"];
    const base = colorScheme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      fonts: navigationFonts,
      colors: {
        ...base.colors,
        primary: p.tint,
        background: p.background,
        card: p.surface,
        text: p.text,
        border: p.border,
        notification: p.tint,
      },
    };
  }, [colorScheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navigationTheme}>
        <BottomSheetModalProvider>
          <ReminderBootstrap />
          <EASUpdateSync />
          <CurrencyOnboardingRedirect />
          <BiometricGate>
            <View style={{ flex: 1 }}>
              <Stack>
                <Stack.Screen
                  name="onboarding"
                  options={{ headerShown: false, gestureEnabled: false }}
                />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="backup"
                  options={{
                    title: "Backup & import",
                    headerBackButtonDisplayMode: "minimal",
                  }}
                />
                <Stack.Screen
                  name="modal"
                  options={{ presentation: "modal", title: "About" }}
                />
                <Stack.Screen
                  name="privacy"
                  options={{
                    title: "Privacy policy",
                    headerBackButtonDisplayMode: "minimal",
                  }}
                />
              </Stack>
              <View
                pointerEvents="box-none"
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: insets.bottom + 72,
                  zIndex: 50,
                }}
              >
                <UndoBanner />
              </View>
            </View>
          </BiometricGate>
        </BottomSheetModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function EASUpdateSync() {
  const { isUpdateAvailable, isUpdatePending, isDownloading } =
    Updates.useUpdates();

  useEffect(() => {
    if (!Updates.isEnabled) return;
    if (isUpdatePending) {
      void Updates.reloadAsync();
    }
  }, [isUpdatePending]);

  useEffect(() => {
    if (!Updates.isEnabled) return;
    if (isUpdateAvailable && !isDownloading && !isUpdatePending) {
      void Updates.fetchUpdateAsync();
    }
  }, [isUpdateAvailable, isDownloading, isUpdatePending]);

  return null;
}
