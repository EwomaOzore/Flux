import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import React from "react";
import type { ColorValue } from "react-native";

import { GlassTabBar } from "@/components/GlassTabBar";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { typeface } from "@/constants/typography";

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

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: palette.tint,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarShowLabel: false,
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: palette.headerBackground,
        },
        headerTitleStyle: {
          fontFamily: typeface.bold,
          fontSize: 18,
          letterSpacing: -0.3,
          color: palette.text,
        },
        headerShadowVisible: false,
        headerTintColor: palette.tint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: "Timeline",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="bars" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="plus-square-o" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="next"
        options={{
          title: "Next",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="calendar-o" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="sun-o" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
