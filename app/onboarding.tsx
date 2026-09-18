import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CurrencyPickerList } from "@/components/CurrencyPickerList";
import { Text } from "@/components/Themed";
import { FluxTextInput, ScreenScroll, useFluxPalette } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import {
  currencyOption,
  currencyOptionsPreferredFirst,
  detectCurrencyFromDevice,
  type CurrencyCode,
} from "@/src/lib/currencies";
import { useCurrencyStore } from "@/src/state/currencyStore";

const brandLogo = require("../assets/images/FluxLogo.png");

const FEATURES = [
  { icon: "lock", label: "Private — budget stays on your device" },
  { icon: "briefcase", label: "Multi-income ready — salary, gigs, more" },
  { icon: "star", label: "Calculator only — not financial advice" },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette, colorScheme } = useFluxPalette();
  const dark = colorScheme === "dark";
  const completeOnboarding = useCurrencyStore((s) => s.completeOnboarding);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const suggestedCurrency = useMemo(() => detectCurrencyFromDevice(), []);
  const [selected, setSelected] = useState<CurrencyCode>(suggestedCurrency);
  const currencyOptions = useMemo(
    () => currencyOptionsPreferredFirst(suggestedCurrency),
    [suggestedCurrency],
  );

  const accent = dark ? "#48B872" : "#2B7A50";
  const cardBorder = dark ? palette.cardBorder : "#E0DAD3";
  const cardBg = dark ? palette.inputBackground : "#FFFFFF";
  const selectedCurrency = currencyOption(selected);
  const trimmedName = name.trim();

  const onGetStarted = () => {
    if (!trimmedName) {
      Alert.alert("Name needed", "Enter your first name to continue.");
      return;
    }
    setStep(2);
  };

  const onContinue = () => {
    if (!trimmedName) {
      Alert.alert("Name needed", "Go back and enter your first name.");
      return;
    }
    completeOnboarding(selected, trimmedName);
    router.replace("/(tabs)");
  };

  return (
    <ScreenScroll>
      {step === 1 ? (
        <View
          style={[
            styles.stepFill,
            {
              paddingTop: Math.max(insets.top - spacing.md, 0),
              paddingBottom: Math.max(insets.bottom, spacing.sm),
            },
          ]}
        >
          <View
            style={[
              styles.brandSoft,
              {
                backgroundColor: dark
                  ? "rgba(72,184,114,0.18)"
                  : palette.tintMuted,
              },
            ]}
          >
            <Image source={brandLogo} style={styles.brandLogo} />
          </View>

          <Text style={[styles.welcomeTitle, { color: palette.text }]}>
            Welcome{"\n"}to Flux.
          </Text>
          <Text style={[styles.welcomeSub, { color: palette.textMuted }]}>
            See exactly what you have left after every bill is paid. Calm
            arithmetic — nothing more.
          </Text>

          <Text style={[styles.nameLabel, { color: palette.text }]}>
            What should we call you?
          </Text>
          <FluxTextInput
            value={name}
            onChangeText={setName}
            placeholder="Your first name"
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="given-name"
            textContentType="givenName"
            returnKeyType="next"
            onSubmitEditing={onGetStarted}
            maxLength={40}
            accessibilityLabel="Your first name"
            style={styles.nameInput}
          />

          <View style={styles.featureList}>
            {FEATURES.map((feature) => (
              <View
                key={feature.label}
                style={[
                  styles.featureCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  },
                ]}
              >
                <FontAwesome
                  name={feature.icon}
                  size={16}
                  color={
                    feature.icon === "lock"
                      ? palette.accentBills
                      : feature.icon === "briefcase"
                        ? palette.textSecondary
                        : palette.text
                  }
                  style={styles.featureIcon}
                />
                <Text
                  style={[styles.featureText, { color: palette.textSecondary }]}
                >
                  {feature.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={[styles.legalNote, { color: palette.textMuted }]}>
              By continuing you agree to our{" "}
              <Text
                style={[styles.legalLink, { color: accent }]}
                onPress={() => router.push("/terms")}
              >
                Terms
              </Text>{" "}
              and{" "}
              <Text
                style={[styles.legalLink, { color: accent }]}
                onPress={() => router.push("/privacy")}
              >
                Privacy Policy
              </Text>
              . Flux does not collect your budget data.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Get started"
              onPress={onGetStarted}
              style={({ pressed }) => [
                styles.cta,
                { backgroundColor: accent, opacity: pressed ? 0.92 : 1 },
              ]}
            >
              <Text style={styles.ctaLabel}>Get started →</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.stepFill,
            {
              paddingTop: Math.max(insets.top - spacing.md, 0),
              paddingBottom: Math.max(insets.bottom, spacing.sm),
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => setStep(1)}
            hitSlop={10}
            style={styles.backRow}
          >
            <FontAwesome
              name="arrow-left"
              size={13}
              color={palette.textMuted}
            />
            <Text style={[styles.backText, { color: palette.textMuted }]}>
              Back
            </Text>
          </Pressable>

          <Text style={[styles.stepKicker, { color: palette.textMuted }]}>
            STEP 2 OF 2
          </Text>
          <Text style={[styles.currencyTitle, { color: palette.text }]}>
            Pick your currency
          </Text>
          <Text style={[styles.currencySub, { color: palette.textMuted }]}>
            Based on your device region — Change anytime in settings.
          </Text>

          <CurrencyPickerList
            selected={selected}
            onSelect={setSelected}
            options={currencyOptions}
            variant="cards"
          />

          <View style={styles.footer}>
            <Text style={[styles.legalNote, { color: palette.textMuted }]}>
              By continuing you agree to our{" "}
              <Text
                style={[styles.legalLink, { color: accent }]}
                onPress={() => router.push("/terms")}
              >
                Terms
              </Text>{" "}
              and{" "}
              <Text
                style={[styles.legalLink, { color: accent }]}
                onPress={() => router.push("/privacy")}
              >
                Privacy Policy
              </Text>
              .
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Continue with ${selectedCurrency.code}`}
              onPress={onContinue}
              style={({ pressed }) => [
                styles.cta,
                { backgroundColor: accent, opacity: pressed ? 0.92 : 1 },
              ]}
            >
              <Text style={styles.ctaLabel}>
                Continue with {selectedCurrency.code} ({selectedCurrency.symbol}
                )
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  stepFill: {
    flexGrow: 1,
  },
  brandSoft: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  brandLogo: {
    width: 48,
    height: 48,
  },
  welcomeTitle: {
    fontFamily: typeface.display,
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: -1.2,
    marginBottom: spacing.md,
  },
  welcomeSub: {
    fontFamily: typeface.regular,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.lg,
    maxWidth: 340,
  },
  nameLabel: {
    fontFamily: typeface.semibold,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  nameInput: {
    marginBottom: spacing.xl,
  },
  featureList: {
    gap: spacing.sm,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    gap: spacing.sm,
  },
  featureIcon: {
    width: 22,
    textAlign: "center",
  },
  featureText: {
    flex: 1,
    fontFamily: typeface.regular,
    fontSize: 15,
    lineHeight: 21,
  },
  footer: {
    marginTop: "auto",
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  legalNote: {
    fontFamily: typeface.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  legalLink: {
    fontFamily: typeface.semibold,
    fontSize: 12,
  },
  cta: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaLabel: {
    fontFamily: typeface.bold,
    color: "#FFFFFF",
    fontSize: 16,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.lg,
    alignSelf: "flex-start",
  },
  backText: {
    fontFamily: typeface.regular,
    fontSize: 15,
  },
  stepKicker: {
    fontFamily: typeface.bold,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  currencyTitle: {
    fontFamily: typeface.displayRegular,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.8,
    marginBottom: spacing.sm,
  },
  currencySub: {
    fontFamily: typeface.regular,
    fontSize: 15,
    marginBottom: spacing.lg,
  },
});
