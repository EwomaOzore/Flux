import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { CurrencyPickerList } from "@/components/CurrencyPickerList";
import { Text } from "@/components/Themed";
import { PrimaryButton, ScreenScroll, useFluxPalette } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/src/lib/currencies";
import { useCurrencyStore } from "@/src/state/currencyStore";

export default function OnboardingScreen() {
  const router = useRouter();
  const { palette } = useFluxPalette();
  const completeOnboarding = useCurrencyStore((s) => s.completeOnboarding);
  const [selected, setSelected] = useState<CurrencyCode>(DEFAULT_CURRENCY);

  const onContinue = () => {
    completeOnboarding(selected);
    router.replace("/(tabs)");
  };

  return (
    <ScreenScroll>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: palette.tintStrong }]}>
          Welcome to Flux
        </Text>
        <Text style={[styles.title, { color: palette.text }]}>
          Choose your currency
        </Text>
        <Text style={[styles.sub, { color: palette.textSecondary }]}>
          Amounts in the app will display in this currency. You can change it
          anytime in Settings.
        </Text>
      </View>

      <CurrencyPickerList selected={selected} onSelect={setSelected} />

      <PrimaryButton
        label="Continue"
        onPress={onContinue}
        style={styles.continueBtn}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
  },
  continueBtn: {
    marginTop: spacing.lg,
  },
});
