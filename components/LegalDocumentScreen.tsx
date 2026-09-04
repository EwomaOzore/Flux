import { StatusBar } from "expo-status-bar";
import { ScrollView, View as RNView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import {
  LEGAL_LAST_UPDATED,
  type LegalSection,
} from "@/src/lib/legalContent";

type Props = Readonly<{
  title: string;
  sections: readonly LegalSection[];
}>;

export function LegalDocumentScreen({ title, sections }: Props) {
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
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.updated, { color: palette.textMuted }]}>
          Last updated {LEGAL_LAST_UPDATED}
        </Text>
        {sections.map((section) => (
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
