import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import FontAwesome from "@expo/vector-icons/FontAwesome";
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
import "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
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
    <ThemeProvider value={navigationTheme}>
      <ReminderBootstrap />
      <EASUpdateSync />
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="backup"
            options={{
              title: "Backup & import",
              headerBackButtonDisplayMode: "minimal",
            }}
          />
          <Stack.Screen
            name="upcoming"
            options={{
              title: "Upcoming",
              headerBackButtonDisplayMode: "minimal",
            }}
          />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "About" }}
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
    </ThemeProvider>
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
