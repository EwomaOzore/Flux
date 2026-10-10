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
import { tabSpotlightRect } from "@/src/tour/tabSpotlight";
import {
  useTourTargetRegistry,
  type TourRect,
} from "@/src/tour/TourTargetContext";

const PAD = 8;
const HOLE_RADIUS = 20;
const DIM = "rgba(28,24,20,0.72)";

/** Dim the screen with a rounded cutout. A thick border is the shade; its inner edge is the hole. */
function roundedCutout(
  hx: number,
  hy: number,
  hw: number,
  hh: number,
  winW: number,
  winH: number,
) {
  const bleed = Math.ceil(Math.max(winW, winH));
  return {
    position: "absolute" as const,
    left: hx - bleed,
    top: hy - bleed,
    width: hw + bleed * 2,
    height: hh + bleed * 2,
    borderWidth: bleed,
    borderColor: DIM,
    borderRadius: HOLE_RADIUS + bleed,
    backgroundColor: "transparent",
  };
}

/** Pager pages are laid out in a row, so a focused page can measure off-screen. */
function placeOnScreen(rect: TourRect, winW: number): TourRect {
  if (winW <= 0) return rect;
  const mostlyOffRight = rect.x >= winW - 8;
  const mostlyOffLeft = rect.x + rect.width <= 8;
  if (!mostlyOffRight && !mostlyOffLeft) return rect;
  const pages = Math.floor(rect.x / winW);
  return { ...rect, x: rect.x - pages * winW };
}

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
  const sheetOpen = useTourStore((s) => s.sheetOpen);
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

  const readHole = useCallback(async () => {
    if (!spotlightId || sheetOpen) return null;
    if (spotlightId === "tab-plan" || spotlightId === "tab-home") {
      return tabSpotlightRect(spotlightId, winW, winH, insets.bottom);
    }
    const rect = await registry.measure(spotlightId);
    if (!rect) return null;
    return placeOnScreen(rect, winW);
  }, [insets.bottom, registry, sheetOpen, spotlightId, winH, winW]);

  const remMeasure = useCallback(async () => {
    setHole(await readHole());
  }, [readHole]);

  useEffect(() => {
    if (!active || sheetOpen) {
      setHole(null);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const run = async () => {
      // Drop the previous step's hole so step 2 doesn't keep step 1's ring.
      setHole(null);
      // Target may mount a frame after tab/step change — retry briefly.
      for (let attempt = 0; attempt < 16 && !cancelled; attempt++) {
        const scrolled = spotlightId
          ? await registry.ensureVisible(spotlightId)
          : false;
        if (cancelled) return;
        if (scrolled) {
          await new Promise((r) => setTimeout(r, 320));
          if (cancelled) return;
        }
        const rect = await readHole();
        if (rect) {
          setHole(rect);
          break;
        }
        await new Promise((r) => setTimeout(r, 50));
      }
      if (cancelled) return;
      intervalId = setInterval(() => {
        void remMeasure();
      }, 500);
      if (cancelled) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    void run();
    return () => {
      cancelled = true;
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  }, [
    active,
    remMeasure,
    stepIndex,
    pathname,
    sheetOpen,
    readHole,
    registry,
    spotlightId,
  ]);

  if (!active || !step) return null;

  // Form sheets must stay fully interactive — hide the spotlight while open.
  // Advancement still happens in AppTourHost when the user saves.
  if (sheetOpen) return null;

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
  const onTabBar = spotlightId === "tab-plan" || spotlightId === "tab-home";
  const targetInLowerHalf = hasHole && hy > winH * 0.45;

  // Keep the card off the control: below a top target, above a lower one.
  const tipStyle =
    onTabBar || targetInLowerHalf
      ? { top: insets.top + spacing.md }
      : { bottom: Math.max(insets.bottom, spacing.sm) + 76 };

  return (
    <View
      collapsable={false}
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, styles.root]}
    >
      {hasHole ? (
        <>
          <View
            pointerEvents="none"
            style={roundedCutout(hx, hy, hw, hh, winW, winH)}
          />
          <View
            pointerEvents="auto"
            style={[styles.blocker, { top: 0, left: 0, right: 0, height: hy }]}
          />
          <View
            pointerEvents="auto"
            style={[
              styles.blocker,
              { top: hy + hh, left: 0, right: 0, bottom: 0 },
            ]}
          />
          <View
            pointerEvents="auto"
            style={[
              styles.blocker,
              { top: hy, left: 0, width: hx, height: hh },
            ]}
          />
          <View
            pointerEvents="auto"
            style={[
              styles.blocker,
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
                borderRadius: HOLE_RADIUS,
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
  blocker: {
    position: "absolute",
  },
  ring: {
    position: "absolute",
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
