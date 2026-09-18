import FontAwesome from "@expo/vector-icons/FontAwesome";
import TopTabs, { type MaterialTopTabBarProps } from "expo-router/js-top-tabs";
import {
  BottomTabBarHeightCallbackContext,
  BottomTabBarHeightContext,
} from "expo-router/tabs";
import React, { useCallback, useState } from "react";
import type { ColorValue } from "react-native";

import { FabOverlayProvider } from "@/components/FabOverlay";
import { GlassTabBar } from "@/components/GlassTabBar";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useTourStore } from "@/src/state/tourStore";

function TabBarIcon(
  props: Readonly<{
    name: React.ComponentProps<typeof FontAwesome>["name"];
    color: ColorValue;
  }>,
) {
  return (
    <FontAwesome
      size={20}
      style={{ marginBottom: -1 }}
      name={props.name}
      color={typeof props.color === "string" ? props.color : undefined}
    />
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const tourActive = useTourStore((s) => s.active);
  const [tabBarHeight, setTabBarHeight] = useState(0);
  const onTabBarHeight = useCallback((height: number) => {
    setTabBarHeight(height);
  }, []);

  return (
    <BottomTabBarHeightCallbackContext.Provider value={onTabBarHeight}>
      <BottomTabBarHeightContext.Provider value={tabBarHeight}>
        <FabOverlayProvider>
          <TopTabs
            tabBarPosition="bottom"
            tabBar={(props: MaterialTopTabBarProps) => (
              <GlassTabBar {...props} />
            )}
            screenOptions={{
              // Keep tour steps on-rails; otherwise swipe works Instagram-style.
              swipeEnabled: !tourActive,
              animationEnabled: true,
              lazy: true,
              lazyPreloadDistance: 1,
              tabBarShowIcon: true,
              tabBarShowLabel: true,
              tabBarActiveTintColor: palette.tint,
              tabBarInactiveTintColor: palette.tabIconDefault,
              tabBarStyle: {
                backgroundColor: "transparent",
                elevation: 0,
                shadowOpacity: 0,
              },
            }}
          >
            <TopTabs.Screen
              name="index"
              options={{
                title: "Home",
                tabBarIcon: ({ color }: { color: ColorValue }) => (
                  <TabBarIcon name="home" color={color} />
                ),
              }}
            />
            <TopTabs.Screen
              name="timeline"
              options={{
                title: "Timeline",
                tabBarIcon: ({ color }: { color: ColorValue }) => (
                  <TabBarIcon name="bars" color={color} />
                ),
              }}
            />
            <TopTabs.Screen
              name="plan"
              options={{
                title: "Plan",
                tabBarIcon: ({ color }: { color: ColorValue }) => (
                  <TabBarIcon name="plus-square-o" color={color} />
                ),
              }}
            />
            <TopTabs.Screen
              name="next"
              options={{
                title: "Next",
                tabBarIcon: ({ color }: { color: ColorValue }) => (
                  <TabBarIcon name="calendar-o" color={color} />
                ),
              }}
            />
            <TopTabs.Screen
              name="settings"
              options={{
                title: "Settings",
                tabBarIcon: ({ color }: { color: ColorValue }) => (
                  <TabBarIcon name="sun-o" color={color} />
                ),
              }}
            />
          </TopTabs>
        </FabOverlayProvider>
      </BottomTabBarHeightContext.Provider>
    </BottomTabBarHeightCallbackContext.Provider>
  );
}
