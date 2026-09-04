import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, View as RNView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";

export default function AboutModal() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.outer}>
      <RNView
        style={[styles.heroStripe, { backgroundColor: palette.tintMuted }]}
      />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <Text style={[styles.title, { color: palette.text }]}>Flux</Text>
        <Text style={[styles.lead, { color: palette.textSecondary }]}>
          A private payday planner: combine jobs or side gigs, track bills in
          your currency, and see what&apos;s left after they&apos;re paid. Home
          shows this month&apos;s run, Timeline lists months with line items,
          and Plan is where you tune income and bills.
        </Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          Flux does not move money, connect to banks, or give financial,
          investment, or tax advice. Totals are arithmetic from numbers you
          enter — you stay in control.
        </Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          Your budget data stays on this device. We do not collect it. See the
          Privacy Policy for limited anonymous technical diagnostics used to
          keep the app updated.
        </Text>

        <Pressable
          accessibilityRole="link"
          onPress={() => router.push("/privacy")}
          style={({ pressed }) => [
            styles.linkBtn,
            {
              borderColor: palette.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.link, { color: palette.tint }]}>
            Privacy policy
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push("/terms")}
          style={({ pressed }) => [
            styles.linkBtn,
            {
              borderColor: palette.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.link, { color: palette.tint }]}>
            Terms & Conditions
          </Text>
        </Pressable>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  heroStripe: {
    height: 6,
    width: "100%",
  },
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontFamily: typeface.displayRegular,
    fontSize: 32,
    letterSpacing: -0.8,
    marginTop: spacing.sm,
  },
  lead: {
    fontFamily: typeface.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: typeface.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  linkBtn: {
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  link: {
    fontFamily: typeface.semibold,
    fontSize: 15,
  },
});
