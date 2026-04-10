import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useContext, useLayoutEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

const BAR_HEIGHT = 54;
const SIDE_INSET = 18;
/** Space between pill and bottom safe inset */
const FLOAT_ABOVE_HOME = 8;
/** Extra space above the pill so scroll content clears it */
const CLEAR_ABOVE_PILL = 12;

function webFallbackBackground(dark: boolean) {
  return dark ? 'rgba(30,41,59,0.82)' : 'rgba(255,255,255,0.78)';
}

function glassBorderColor(dark: boolean) {
  return dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.65)';
}

export function GlassTabBar(props: Readonly<BottomTabBarProps>) {
  const { state, descriptors, navigation, insets } = props;
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const palette = Colors[colorScheme ?? 'light'];
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
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: reservedHeight,
        backgroundColor: 'transparent',
      }}>
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
            },
          ]}>
          {Platform.OS === 'web' ? (
            <View style={[styles.webFill, { backgroundColor: webFallbackBackground(dark) }]}>
              <TabRow
                state={state}
                descriptors={descriptors}
                navigation={navigation}
                activeColor={palette.tabIconSelected}
                inactiveColor={palette.tabIconDefault}
              />
            </View>
          ) : (
            <BlurView tint={dark ? 'dark' : 'light'} intensity={dark ? 48 : 72} style={styles.blurFill}>
              <View style={styles.blurStack}>
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: dark ? 'rgba(15,23,42,0.3)' : 'rgba(255,255,255,0.2)',
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

type RowProps = Pick<BottomTabBarProps, 'state' | 'descriptors' | 'navigation'> & {
  activeColor: string;
  inactiveColor: string;
};

function TabRow({ state, descriptors, navigation, activeColor, inactiveColor }: RowProps) {
  return (
    <View style={styles.row}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? activeColor : inactiveColor;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const rawLabel = options.tabBarLabel ?? options.title ?? route.name;
        const label = typeof rawLabel === 'string' ? rawLabel : route.name;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? String(label)}
            onPress={onPress}
            onLongPress={onLongPress}
            style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.75 : 1 }]}>
            {options.tabBarIcon?.({ focused, color, size: 22 }) ?? null}
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pillShadow: {
    position: 'absolute',
    borderRadius: radii.full,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: StyleSheet.hairlineWidth },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: {
        elevation: 14,
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
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
