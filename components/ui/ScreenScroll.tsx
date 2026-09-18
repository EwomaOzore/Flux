import { HeaderHeightContext } from "expo-router/react-navigation";
import { BottomTabBarHeightContext } from "expo-router/tabs";
import { useContext, useRef, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { View as ThemedView } from "@/components/Themed";
import { spacing } from "@/constants/theme";

import { useFluxPalette } from "@/components/ui/useFluxPalette";
import {
  TourScrollProvider,
  useTourScrollRegistration,
} from "@/src/tour/TourTargetContext";

type Props = {
  children: ReactNode;
} & Omit<ScrollViewProps, "children" | "style" | "contentContainerStyle">;

export function ScreenScroll({ children, onScroll, ...scrollProps }: Props) {
  const { palette } = useFluxPalette();
  const tabBarHeightContext = useContext(BottomTabBarHeightContext);
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  const insets = useSafeAreaInsets();
  /** Tab screens get measured bar height; stack-only screens (e.g. /backup) have no tab context. */
  const bottomPad =
    tabBarHeightContext !== undefined
      ? tabBarHeightContext
      : Math.max(insets.bottom, spacing.md);

  const scrollRef = useRef<ScrollView>(null);
  const viewportRef = useRef<View>(null);
  const {
    scrollApi,
    onScroll: onTourScroll,
    scrollEventThrottle,
  } = useTourScrollRegistration(scrollRef, viewportRef);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onTourScroll(e);
    onScroll?.(e);
  };

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <View ref={viewportRef} style={styles.viewport} collapsable={false}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, backgroundColor: palette.background }}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(48, bottomPad + spacing.md) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          {...scrollProps}
          onScroll={handleScroll}
          scrollEventThrottle={scrollEventThrottle}
        >
          <TourScrollProvider api={scrollApi}>
            <ThemedView style={styles.inner}>{children}</ThemedView>
          </TourScrollProvider>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kav: {
    flex: 1,
  },
  viewport: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  inner: {
    padding: spacing.lg,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    gap: spacing.lg,
  },
});
