import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { useContext, useLayoutEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { TourTarget } from "@/components/TourTarget";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { radii, spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import type { TourTargetId } from "@/src/lib/tourSteps";

const BAR_HEIGHT = 58;
const SIDE_INSET = 14;
const FLOAT_ABOVE_HOME = 8;
const CLEAR_ABOVE_PILL = 12;

function tabTourId(routeName: string): TourTargetId | null {
  if (routeName === "index") return "tab-home";
  if (routeName === "plan") return "tab-plan";
  return null;
}

function webFallbackBackground(dark: boolean) {
  return dark ? "rgba(42,36,32,0.88)" : "rgba(255,255,255,0.88)";
}

function glassBorderColor(dark: boolean) {
  return dark ? "rgba(255,255,255,0.1)" : "rgba(208,202,194,0.9)";
}

export function GlassTabBar(props: Readonly<BottomTabBarProps>) {
  const { state, descriptors, navigation, insets } = props;
  const colorScheme = useColorScheme();
  const dark = colorScheme === "dark";
  const palette = Colors[colorScheme ?? "light"];
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);

  const bottom = Math.max(insets.bottom, spacing.sm) + FLOAT_ABOVE_HOME;
  const reservedHeight = bottom + BAR_HEIGHT + CLEAR_ABOVE_PILL;

  useLayoutEffect(() => {
    onHeightChange?.(reservedHeight);
  }, [onHeightChange, reservedHeight]);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: reservedHeight,
        backgroundColor: "transparent",
      }}
    >
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View
          style={[
            styles.pillShadow,
            {
              left: SIDE_INSET,
              right: SIDE_INSET,
              bottom,
              height: BAR_HEIGHT,
              borderColor: glassBorderColor(dark),
              backgroundColor: dark ? palette.tabBarBackground : "#FFFFFF",
            },
          ]}
        >
          {Platform.OS === "web" ? (
            <View
              style={[
                styles.webFill,
                { backgroundColor: webFallbackBackground(dark) },
              ]}
            >
              <TabRow
                state={state}
                descriptors={descriptors}
                navigation={navigation}
                activeColor={palette.tabIconSelected}
                inactiveColor={palette.tabIconDefault}
              />
            </View>
          ) : (
            <BlurView
              tint={dark ? "dark" : "light"}
              intensity={dark ? 40 : 64}
              style={styles.blurFill}
            >
              <View style={styles.blurStack}>
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: dark
                        ? "rgba(28,24,20,0.35)"
                        : "rgba(255,255,255,0.45)",
                    },
                  ]}
                />
                <TabRow
                  state={state}
                  descriptors={descriptors}
                  navigation={navigation}
                  activeColor={palette.tabIconSelected}
                  inactiveColor={palette.tabIconDefault}
                />
              </View>
            </BlurView>
          )}
        </View>
      </View>
    </View>
  );
}

type RowProps = Pick<
  BottomTabBarProps,
  "state" | "descriptors" | "navigation"
> & {
  activeColor: string;
  inactiveColor: string;
};

function TabRow({
  state,
  descriptors,
  navigation,
  activeColor,
  inactiveColor,
}: RowProps) {
  return (
    <View style={styles.row}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? activeColor : inactiveColor;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        const rawLabel = options.tabBarLabel ?? options.title ?? route.name;
        const label = typeof rawLabel === "string" ? rawLabel : route.name;
        const tourId = tabTourId(route.name);

        const tabButton = (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={
              options.tabBarAccessibilityLabel ?? String(label)
            }
            onPress={onPress}
            onLongPress={onLongPress}
            style={({ pressed }) => [
              styles.tab,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            {options.tabBarIcon?.({ focused, color, size: 20 }) ?? null}
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );

        if (!tourId) {
          return (
            <View key={route.key} style={styles.tabTarget}>
              {tabButton}
            </View>
          );
        }

        return (
          <TourTarget key={route.key} id={tourId} style={styles.tabTarget}>
            {tabButton}
          </TourTarget>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pillShadow: {
    position: "absolute",
    borderRadius: radii.full,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
  },
  blurFill: {
    flex: 1,
  },
  blurStack: {
    flex: 1,
  },
  webFill: {
    flex: 1,
    borderRadius: radii.full,
    overflow: "hidden",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
    gap: 2,
  },
  tabTarget: {
    flex: 1,
  },
  label: {
    fontFamily: typeface.medium,
    fontSize: 10,
    letterSpacing: 0.1,
  },
});
