import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/Themed";
import { useFluxPalette } from "@/components/ui";
import { radii, spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";

type TourStep = {
  readonly icon: ComponentProps<typeof FontAwesome>["name"];
  readonly title: string;
  readonly body: string;
  readonly tabHint?: string;
};

const TOUR_STEPS: readonly TourStep[] = [
  {
    icon: "compass",
    title: "Find your way around",
    body: "Flux has five tabs along the bottom: Home, Timeline, Plan, Next, and Settings. Everything stays on this device.",
    tabHint: "Bottom bar",
  },
  {
    icon: "plus-square-o",
    title: "Start in Plan",
    body: "Add your income streams and recurring bills here. Your cushion is built from these — edit anytime.",
    tabHint: "Plan",
  },
  {
    icon: "home",
    title: "Home is your cushion",
    body: "See what’s left after bills this payday month. Tap the big number to see how it’s calculated.",
    tabHint: "Home",
  },
  {
    icon: "plus",
    title: "Quick-add outflows",
    body: "The + button on Home logs payday spending — rent share, transfers, one-offs — without leaving the screen.",
    tabHint: "Home · +",
  },
  {
    icon: "calendar-o",
    title: "Look ahead & back",
    body: "Timeline is your month history. Next shows the upcoming few paydays. Import a bank statement in Plan to suggest bills.",
    tabHint: "Timeline · Next · Plan",
  },
];

type Props = {
  readonly visible: boolean;
  readonly onFinish: () => void;
};

export function AppTourModal({ visible, onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const { palette, colorScheme } = useFluxPalette();
  const dark = colorScheme === "dark";
  const accent = dark ? "#48B872" : "#2B7A50";
  const cardBorder = dark ? palette.cardBorder : "#E0DAD3";
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  const step = TOUR_STEPS[index] ?? TOUR_STEPS[0];
  const isLast = index >= TOUR_STEPS.length - 1;
  const progress = useMemo(
    () => `${index + 1} of ${TOUR_STEPS.length}`,
    [index],
  );

  const finish = useCallback(() => {
    setIndex(0);
    onFinish();
  }, [onFinish]);

  const onNext = useCallback(() => {
    if (isLast) {
      finish();
      return;
    }
    setIndex((i) => Math.min(i + 1, TOUR_STEPS.length - 1));
  }, [finish, isLast]);

  const onBack = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={finish}
      statusBarTranslucent
    >
      <View
        style={[styles.backdrop, { backgroundColor: "rgba(28,24,20,0.55)" }]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: cardBorder,
              paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm,
              marginTop: insets.top + spacing.lg,
              marginBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
        >
          <View style={styles.topRow}>
            <Text style={[styles.progress, { color: palette.textMuted }]}>
              TOUR · {progress}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip tour"
              onPress={finish}
              hitSlop={12}
            >
              <Text style={[styles.skip, { color: palette.textMuted }]}>
                Skip
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: dark
                  ? "rgba(72,184,114,0.18)"
                  : palette.tintMuted,
              },
            ]}
          >
            <FontAwesome name={step.icon} size={28} color={accent} />
          </View>

          {step.tabHint ? (
            <View
              style={[
                styles.hintPill,
                {
                  backgroundColor: dark ? "#2A2520" : palette.surfaceMuted,
                  borderColor: cardBorder,
                },
              ]}
            >
              <Text style={[styles.hintText, { color: palette.textSecondary }]}>
                {step.tabHint}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.title, { color: palette.text }]}>
            {step.title}
          </Text>
          <Text style={[styles.body, { color: palette.textMuted }]}>
            {step.body}
          </Text>

          <View style={styles.dots}>
            {TOUR_STEPS.map((s, i) => (
              <View
                key={s.title}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === index ? accent : dark ? "#3A342E" : "#D0CAC2",
                    width: i === index ? 18 : 7,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            {index > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous step"
                onPress={onBack}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  {
                    borderColor: cardBorder,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[styles.secondaryLabel, { color: palette.text }]}>
                  Back
                </Text>
              </Pressable>
            ) : (
              <View style={styles.secondaryBtnSpacer} />
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isLast ? "Finish tour" : "Next step"}
              onPress={onNext}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: accent, opacity: pressed ? 0.92 : 1 },
              ]}
            >
              <Text style={styles.primaryLabel}>
                {isLast ? "Got it" : "Next"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  card: {
    borderRadius: radii.xxl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  progress: {
    fontFamily: typeface.bold,
    fontSize: 11,
    letterSpacing: 1,
  },
  skip: {
    fontFamily: typeface.semibold,
    fontSize: 14,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  hintPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.md,
  },
  hintText: {
    fontFamily: typeface.medium,
    fontSize: 12,
  },
  title: {
    fontFamily: typeface.displayRegular,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: typeface.regular,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.lg,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryBtnSpacer: {
    flex: 1,
  },
  secondaryLabel: {
    fontFamily: typeface.semibold,
    fontSize: 15,
  },
  primaryBtn: {
    flex: 1.4,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryLabel: {
    fontFamily: typeface.bold,
    color: "#FFFFFF",
    fontSize: 16,
  },
});
