import type { BillItem, IncomeStream, PaydayLine } from "@/src/domain/types";
import type { MonthId } from "@/src/domain/month";
import type { BudgetState } from "@/src/state/budgetStore";

type UnknownRecord = Record<string, unknown>;

function isObject(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function parseIncome(input: unknown): IncomeStream | null {
  if (!isObject(input)) return null;
  const id = asString(input.id);
  const label = asString(input.label) ?? "";
  const amountNgn = asNumber(input.amountNgn) ?? 0;
  if (!id) return null;
  const recurrence = input.recurrence === "one_time" ? "one_time" : "recurring";
  return {
    id,
    label,
    amountNgn: Math.max(0, Math.round(amountNgn)),
    note: asString(input.note) ?? undefined,
    recurrence,
    oneTimeMonth:
      recurrence === "one_time"
        ? ((asString(input.oneTimeMonth) as MonthId | null) ?? undefined)
        : undefined,
  };
}

function parseBill(input: unknown): BillItem | null {
  if (!isObject(input)) return null;
  const id = asString(input.id);
  const label = asString(input.label) ?? "";
  const amount = asNumber(input.amount) ?? 0;
  if (!id) return null;
  return { id, label, amount: Math.max(0, Math.round(amount)) };
}

function parseLine(input: unknown): PaydayLine | null {
  if (!isObject(input)) return null;
  const id = asString(input.id);
  const month = asString(input.month);
  const label = asString(input.label) ?? "";
  const amount = asNumber(input.amount) ?? 0;
  if (!id || !month) return null;
  return {
    id,
    month: month as PaydayLine["month"],
    label,
    amount: Math.max(0, Math.round(amount)),
  };
}

/** Accepts Flux backup JSON (v1) and returns a normalized budget state. */
export function parseBudgetImportJson(raw: string): BudgetState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (
    !isObject(parsed) ||
    parsed.format !== "flux-backup" ||
    !isObject(parsed.data)
  ) {
    throw new Error("Unsupported backup format.");
  }
  const data = parsed.data as UnknownRecord;
  const incomeStreams = Array.isArray(data.incomeStreams)
    ? data.incomeStreams
        .map(parseIncome)
        .filter((v): v is IncomeStream => v != null)
    : [];
  const billItems = Array.isArray(data.billItems)
    ? data.billItems
        .map(parseBill)
        .filter((v): v is BillItem => v != null)
    : [];
  const lines = Array.isArray(data.lines)
    ? data.lines
        .map(parseLine)
        .filter((v): v is PaydayLine => v != null)
    : [];
  return { incomeStreams, billItems, lines };
}
