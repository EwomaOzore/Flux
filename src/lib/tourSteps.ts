export type TourTargetId =
  | "tab-plan"
  | "tab-home"
  | "plan-add-income"
  | "plan-add-bill"
  | "plan-add-outflow"
  | "home-cushion"
  | "home-fab";

export type TourRequire =
  | { kind: "route"; route: "plan" | "home" }
  | { kind: "income" }
  | { kind: "bill" }
  | { kind: "line" }
  | { kind: "cushionTap" };

export type TourStep = {
  readonly id: string;
  readonly targetId: TourTargetId;
  /** Tab the target lives on — if user is elsewhere, we spotlight that tab instead. */
  readonly tab: "plan" | "home";
  readonly require: TourRequire;
  readonly title: string;
  readonly body: string;
};

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "open-plan",
    targetId: "tab-plan",
    tab: "plan",
    require: { kind: "route", route: "plan" },
    title: "Open Plan",
    body: "Tap Plan in the tab bar to set up income, bills, and outflows.",
  },
  {
    id: "add-income",
    targetId: "plan-add-income",
    tab: "plan",
    require: { kind: "income" },
    title: "Add income",
    body: "Tap + Add, then enter a label and amount and save.",
  },
  {
    id: "add-bill",
    targetId: "plan-add-bill",
    tab: "plan",
    require: { kind: "bill" },
    title: "Add a bill",
    body: "Tap + Add under Recurring bills, then save at least one bill.",
  },
  {
    id: "add-outflow",
    targetId: "plan-add-outflow",
    tab: "plan",
    require: { kind: "line" },
    title: "Add a payday outflow",
    body: "Tap + Add under Payday outflows, enter an amount, and save.",
  },
  {
    id: "open-home",
    targetId: "tab-home",
    tab: "home",
    require: { kind: "route", route: "home" },
    title: "Check Home",
    body: "Tap Home to see your cushion after bills.",
  },
  {
    id: "see-cushion",
    targetId: "home-cushion",
    tab: "home",
    require: { kind: "cushionTap" },
    title: "Your cushion",
    body: "Tap the cushion card to see how it’s calculated, then close the sheet to finish.",
  },
];

export function isHomePath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/index" ||
    pathname.endsWith("/(tabs)") ||
    pathname.endsWith("/(tabs)/index") ||
    pathname === "/(tabs)/index"
  );
}

export function isPlanPath(pathname: string): boolean {
  return pathname.includes("plan");
}

export function matchesTourRoute(
  pathname: string,
  route: "plan" | "home",
): boolean {
  return route === "plan" ? isPlanPath(pathname) : isHomePath(pathname);
}
