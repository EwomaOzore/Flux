import { formatMonthIdDisplay } from "@/src/domain/month";
import type { BudgetRollupDeps } from "@/src/state/budgetStore";
import { rollupForCurrentPayday } from "@/src/state/budgetStore";

/** JSON written for optional native home-screen widget extensions (iOS WidgetKit / Android App Widget). */
export type WidgetSnapshotPayload = {
  readonly version: 1;
  readonly updatedAt: string;
  readonly paydayMonthLabel: string;
  readonly cushionAfterBillsNgn: number;
  readonly incomeMonthNgn: number;
  readonly billsTotalNgn: number;
  readonly paydayOutflowNgn: number;
};

export function buildWidgetSnapshotPayload(state: BudgetRollupDeps): WidgetSnapshotPayload {
  const roll = rollupForCurrentPayday(state);
  const month = roll?.month ?? "";
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    paydayMonthLabel: month ? formatMonthIdDisplay(month) : "—",
    cushionAfterBillsNgn: Math.round(roll?.cushionAfterBills ?? 0),
    incomeMonthNgn: Math.round(roll?.income ?? 0),
    billsTotalNgn: Math.round(roll?.billsTotal ?? 0),
    paydayOutflowNgn: Math.round(roll?.totalPaydayOutflow ?? 0),
  };
}
