import { spacing } from "@/constants/theme";
import type { TourRect } from "@/src/tour/TourTargetContext";

/** Keep these in step with the floating tab bar. */
export const TAB_BAR_HEIGHT = 58;
export const TAB_SIDE_INSET = 14;
export const TAB_FLOAT_ABOVE_HOME = 8;
export const TAB_ROW_PADDING = 4;

const TAB_COUNT = 5;

const tabIndex: Record<"tab-home" | "tab-plan", number> = {
  "tab-home": 0,
  "tab-plan": 2,
};

/**
 * Window rect for a tab button. Android reports a bad `measureInWindow`
 * for this absolute bar, so the spotlight uses the same geometry the bar lays out with.
 */
export function tabSpotlightRect(
  id: "tab-home" | "tab-plan",
  winW: number,
  winH: number,
  insetBottom: number,
): TourRect {
  const bottom = Math.max(insetBottom, spacing.sm) + TAB_FLOAT_ABOVE_HOME;
  const innerLeft = TAB_SIDE_INSET + TAB_ROW_PADDING;
  const innerWidth = Math.max(
    0,
    winW - TAB_SIDE_INSET * 2 - TAB_ROW_PADDING * 2,
  );
  const tabWidth = innerWidth / TAB_COUNT;
  return {
    x: innerLeft + tabIndex[id] * tabWidth,
    y: winH - bottom - TAB_BAR_HEIGHT,
    width: tabWidth,
    height: TAB_BAR_HEIGHT,
  };
}
