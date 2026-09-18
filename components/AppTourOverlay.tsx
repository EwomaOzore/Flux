import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/Themed";
import { useFluxPalette } from "@/components/ui";
import { radii, spacing } from "@/constants/theme";
import { typeface } from "@/constants/typography";
import {
  matchesTourRoute,
  TOUR_STEPS,
  type TourTargetId,
} from "@/src/lib/tourSteps";
import { useTourStore } from "@/src/state/tourStore";
import {
  useTourTargetRegistry,
  type TourRect,
} from "@/src/tour/TourTargetContext";

const PAD = 8;
const DIM = "rgba(28,24,20,0.72)";

type Props = {
  readonly pathname: string;
};

export function AppTourOverlay({ pathname }: Props) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const { palette, colorScheme } = useFluxPalette();
  const dark = colorScheme === "dark";
  const accent = dark ? "#48B872" : "#2B7A50";
  const registry = useTourTargetRegistry();

  const active = useTourStore((s) => s.active);
  const stepIndex = useTourStore((s) => s.stepIndex);
  const skipTour = useTourStore((s) => s.skipTour);

  const step = TOUR_STEPS[stepIndex];
  const onCorrectTab = step ? matchesTourRoute(pathname, step.tab) : false;

  const spotlightId: TourTargetId | null = step
    ? onCorrectTab
      ? step.targetId
      : step.tab === "plan"
        ? "tab-plan"
        : "tab-home"
    : null;

  const [hole, setHole] = useState<TourRect | null>(null);

  const remMeasure = useCallback(async () => {
    if (!spotlightId) {
      setHole(null);
      return;
    }
    const rect = await registry.measure(spotlightId);
    setHole(rect);
  }, [registry, spotlightId]);

  useEffect(() => {
    if (!active) {
      setHole(null);
      return;
    }
    void remMeasure();
    const id = setInterval(() => {
      void remMeasure();
    }, 500);
    return () => clearInterval(id);
  }, [active, remMeasure, stepIndex, pathname]);

  if (!active || !step) return null;

  const title = onCorrectTab
    ? step.title
    : step.tab === "plan"
      ? "Open Plan"
      : "Open Home";
  const body = onCorrectTab
    ? step.body
    : step.tab === "plan"
      ? "Tap Plan in the tab bar to continue the tour."
      : "Tap Home in the tab bar to continue the tour.";

  const hx = hole ? Math.max(0, hole.x - PAD) : 0;
  const hy = hole ? Math.max(0, hole.y - PAD) : 0;
  const hw = hole ? hole.width + PAD * 2 : 0;
  const hh = hole ? hole.height + PAD * 2 : 0;
  const hasHole = hole !== null && hw > 0 && hh > 0;

  const tipAbove = hasHole ? hy > winH * 0.42 : true;
  const tipStyle = hasHole
    ? tipAbove
      ? { bottom: winH - hy + spacing.sm }
      : { top: hy + hh + spacing.sm }
    : {
        top: insets.top + spacing.xl,
      };

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, styles.root]}
    >
      {/* Dim panels leave a touch-through hole over the target */}
      {hasHole ? (
        <>
          <View
            pointerEvents="auto"
            style={[styles.dim, { top: 0, left: 0, right: 0, height: hy }]}
          />
          <View
            pointerEvents="auto"
            style={[styles.dim, { top: hy + hh, left: 0, right: 0, bottom: 0 }]}
          />
          <View
            pointerEvents="auto"
            style={[styles.dim, { top: hy, left: 0, width: hx, height: hh }]}
          />
          <View
            pointerEvents="auto"
            style={[
              styles.dim,
              {
                top: hy,
                left: hx + hw,
                width: Math.max(0, winW - (hx + hw)),
                height: hh,
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                top: hy,
                left: hx,
                width: hw,
                height: hh,
                borderColor: accent,
              },
            ]}
          />
        </>
      ) : (
        <View
          pointerEvents="auto"
          style={[StyleSheet.absoluteFill, styles.dim]}
        />
      )}

      <View
        pointerEvents="box-none"
        style={[styles.tipWrap, tipStyle, { paddingHorizontal: spacing.lg }]}
      >
        <View
          style={[
            styles.tipCard,
            {
              backgroundColor: palette.surface,
              borderColor: dark ? palette.cardBorder : "#E0DAD3",
            },
          ]}
        >
          <View style={styles.tipTop}>
            <Text style={[styles.progress, { color: palette.textMuted }]}>
              STEP {stepIndex + 1} OF {TOUR_STEPS.length}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip tour"
              onPress={skipTour}
              hitSlop={10}
            >
              <Text style={[styles.skip, { color: palette.textMuted }]}>
                Skip
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
          <Text style={[styles.body, { color: palette.textMuted }]}>
            {body}
          </Text>
          <Text style={[styles.hint, { color: accent }]}>
            {hasHole
              ? "Tap the highlighted control to continue"
              : "Looking for the next control…"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 80,
    elevation: 80,
  },
  dim: {
    position: "absolute",
    backgroundColor: DIM,
  },
  ring: {
    position: "absolute",
    borderRadius: 14,
    borderWidth: 2,
  },
  tipWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 81,
  },
  tipCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
    maxWidth: 420,
    alignSelf: "center",
    width: "100%",
  },
  tipTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
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
  title: {
    fontFamily: typeface.displayRegular,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.4,
    marginBottom: spacing.xs,
  },
  body: {
    fontFamily: typeface.regular,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  hint: {
    fontFamily: typeface.semibold,
    fontSize: 13,
  },
});
