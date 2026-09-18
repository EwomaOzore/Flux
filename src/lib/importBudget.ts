import type { MonthId } from "@/src/domain/month";
import type { BillItem, IncomeStream, PaydayLine } from "@/src/domain/types";
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
  const recurrence = input.recurrence === "monthly" ? "monthly" : "one_time";
  const monthId = month as MonthId;
  return {
    id,
    month: monthId,
    label,
    amount: Math.max(0, Math.round(amount)),
    recurrence,
    ...(recurrence === "monthly"
      ? {
          startMonth: (asString(input.startMonth) as MonthId | null) ?? monthId,
          endMonth:
            (asString(input.endMonth) as MonthId | null) ??
            (asString(input.startMonth) as MonthId | null) ??
            monthId,
        }
      : {}),
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
    ? data.billItems.map(parseBill).filter((v): v is BillItem => v != null)
    : [];
  const lines = Array.isArray(data.lines)
    ? data.lines.map(parseLine).filter((v): v is PaydayLine => v != null)
    : [];
  return { incomeStreams, billItems, lines };
}

/** Split a single CSV row, respecting double-quoted fields. */
function splitCsvRow(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function parseAmountCell(raw: string): number {
  const n = Number(raw.trim());
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

/**
 * Accepts Flux backup CSV from `buildExportCsv` and returns normalized budget state.
 */
export function parseBudgetImportCsv(raw: string): BudgetState {
  const text = raw.replace(/^\uFEFF/, "").trim();
  if (!text) {
    throw new Error("This CSV file is empty.");
  }
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 1) {
    throw new Error("This CSV file is empty.");
  }

  const header = splitCsvRow(lines[0]!).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const typeI = idx("type");
  const idI = idx("id");
  const labelI = idx("label");
  const amountI = idx("amount");

  if (typeI < 0 || idI < 0 || labelI < 0 || amountI < 0) {
    throw new Error(
      "This does not look like a Flux CSV backup (missing type/id/label/amount columns).",
    );
  }

  const monthI = idx("month");
  const noteI = idx("note");
  const recurrenceI = idx("recurrence");
  const oneTimeMonthI = idx("one_time_month");
  const lineRecurrenceI = idx("line_recurrence");
  const lineStartI = idx("line_start_month");
  const lineEndI = idx("line_end_month");

  const cell = (cols: string[], i: number) =>
    i >= 0 && i < cols.length ? (cols[i] ?? "").trim() : "";

  const incomeStreams: IncomeStream[] = [];
  const billItems: BillItem[] = [];
  const paydayLines: PaydayLine[] = [];

  for (let r = 1; r < lines.length; r++) {
    const cols = splitCsvRow(lines[r]!);
    const type = cell(cols, typeI).toLowerCase();
    const id = cell(cols, idI);
    if (!id) continue;
    const label = cell(cols, labelI);
    const amount = parseAmountCell(cell(cols, amountI));

    if (type === "income") {
      const recurrence =
        cell(cols, recurrenceI) === "one_time" ? "one_time" : "recurring";
      const oneTimeMonth = cell(cols, oneTimeMonthI);
      incomeStreams.push({
        id,
        label,
        amountNgn: amount,
        note: cell(cols, noteI) || undefined,
        recurrence,
        oneTimeMonth:
          recurrence === "one_time" && oneTimeMonth
            ? (oneTimeMonth as MonthId)
            : undefined,
      });
      continue;
    }

    if (type === "bill") {
      billItems.push({ id, label, amount });
      continue;
    }

    if (type === "line") {
      const month = cell(cols, monthI);
      if (!month) continue;
      const recurrence =
        cell(cols, lineRecurrenceI) === "monthly" ? "monthly" : "one_time";
      const startMonth = cell(cols, lineStartI) || month;
      const endMonth = cell(cols, lineEndI) || startMonth;
      paydayLines.push({
        id,
        month: month as MonthId,
        label,
        amount,
        recurrence,
        ...(recurrence === "monthly"
          ? {
              startMonth: startMonth as MonthId,
              endMonth: endMonth as MonthId,
            }
          : {}),
      });
    }
  }

  if (
    incomeStreams.length === 0 &&
    billItems.length === 0 &&
    paydayLines.length === 0
  ) {
    throw new Error("No income, bills, or outflows found in this CSV.");
  }

  return {
    incomeStreams,
    billItems,
    lines: paydayLines,
  };
}

/** Detect JSON vs CSV Flux backup and parse. */
export function parseBudgetImport(raw: string, fileName?: string): BudgetState {
  const trimmed = raw.replace(/^\uFEFF/, "").trim();
  const lowerName = (fileName ?? "").toLowerCase();
  const looksCsv =
    lowerName.endsWith(".csv") ||
    (!trimmed.startsWith("{") &&
      /^type\s*,/i.test(trimmed.split(/\r?\n/, 1)[0] ?? ""));

  if (looksCsv) {
    return parseBudgetImportCsv(trimmed);
  }

  try {
    return parseBudgetImportJson(trimmed);
  } catch (jsonErr) {
    // Some share targets strip extensions; fall back to CSV if header matches.
    if (/^type\s*,/i.test(trimmed.split(/\r?\n/, 1)[0] ?? "")) {
      return parseBudgetImportCsv(trimmed);
    }
    throw jsonErr;
  }
}
