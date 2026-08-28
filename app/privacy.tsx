import { StatusBar } from "expo-status-bar";
import { ScrollView, View as RNView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";

const SECTIONS = [
  {
    title: "Overview",
    body: "Flux is a personal budget planner. Your income, bills, and payday plans are stored locally on your device. We do not operate accounts, sync your data to our servers, or sell your information.",
  },
  {
    title: "Data we store on your device",
    body: "Flux keeps the budget information you enter — income streams, bills, timeline entries, currency preference, appearance settings, optional biometric lock preference, and payday reminder settings. This data remains on your phone unless you export or back it up yourself.",
  },
  {
    title: "Camera and photos",
    body: "If you scan or attach a receipt, Flux requests access to your camera or photo library. Images are processed on your device to extract text for expense entry. Receipt images are not uploaded to Flux servers.",
  },
  {
    title: "Biometric lock",
    body: "If you enable biometric lock, Flux uses Face ID, Touch ID, or your device PIN through the operating system to unlock the app. Flux does not receive or store your biometric data.",
  },
  {
    title: "Notifications",
    body: "If you enable payday reminders, Flux schedules local notifications on your device. Notification content stays on your device and is not sent to us.",
  },
  {
    title: "Export and import",
    body: "You can export your data to a file and share or store it wherever you choose. Import restores data from a file you provide. Flux does not access those files except when you explicitly choose to import them.",
  },
  {
    title: "Service providers",
    body: "Flux is built with Expo and may use Expo Application Services for app updates and anonymous reliability metrics. Those services do not receive your budget entries, receipts, or financial details.",
  },
  {
    title: "Children",
    body: "Flux is not directed at children under 13, and we do not knowingly collect personal information from children.",
  },
  {
    title: "Changes",
    body: "We may update this policy from time to time. Continued use of Flux after changes means you accept the updated policy.",
  },
  {
    title: "Contact",
    body: "Questions about privacy? Email support at the address listed on your App Store or Google Play listing.",
  },
] as const;

export default function PrivacyScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.outer}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Text style={[styles.title, { color: palette.text }]}>Privacy policy</Text>
        <Text style={[styles.updated, { color: palette.textMuted }]}>
          Last updated August 28, 2026
        </Text>
        {SECTIONS.map((section) => (
          <RNView key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.body, { color: palette.textSecondary }]}>
              {section.body}
            </Text>
          </RNView>
        ))}
      </ScrollView>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontFamily: typeface.displayRegular,
    fontSize: 28,
    letterSpacing: -0.6,
  },
  updated: {
    fontFamily: typeface.regular,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontFamily: typeface.semibold,
    fontSize: 16,
  },
  body: {
    fontFamily: typeface.regular,
    fontSize: 15,
    lineHeight: 22,
  },
});
