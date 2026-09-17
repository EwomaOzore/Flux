import { formatMonthId, type MonthId } from "@/src/domain/month";
import { extractPdfTextLines } from "@/src/lib/pdfText";

/**
 * Bank statement import (CSV and PDF) — parsed entirely on-device.
 *
 * Handles the common Nigerian/international shapes:
 * - Separate Debit / Credit columns (GTB, Access, Zenith, UBA style)
 * - Single signed Amount column (many fintech exports)
 * - Quoted fields, thousands separators, ₦/$ symbols, `(123)` negatives
 * - PDF statements with a text layer (tabular Posted/Value date rows)
 */

export type StatementTransaction = {
  readonly month: MonthId;
  readonly description: string;
  /** Positive amount leaving the account. Credits are excluded upstream. */
  readonly debit: number;
};

export type BillSuggestion = {
  /** Normalized grouping key. */
  readonly key: string;
  /** Human-friendly label for the bill. */
  readonly label: string;
  /** Suggested monthly amount (median of matched debits). */
  readonly amount: number;
  /** How many matching debits were found. */
  readonly occurrences: number;
  /** Distinct months the debit appeared in. */
  readonly monthsSeen: number;
};

export type StatementParseResult = {
  readonly transactions: StatementTransaction[];
  readonly firstMonth: MonthId | null;
  readonly lastMonth: MonthId | null;
  readonly skippedRows: number;
};

/** Minimal CSV parser with quoted-field support. No external deps. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

function headerKey(cell: string): string {
  return cell.toLowerCase().replace(/[^a-z]/g, "");
}

const DATE_HEADERS = [
  "date",
  "transdate",
  "transactiondate",
  "valuedate",
  "postingdate",
  "postdate",
  "txndate",
];
const DESC_HEADERS = [
  "description",
  "narration",
  "narrative",
  "details",
  "transactiondetails",
  "remarks",
  "particulars",
  "reference",
  "merchant",
  "payee",
];
const DEBIT_HEADERS = [
  "debit",
  "debits",
  "withdrawal",
  "withdrawals",
  "moneyout",
  "dr",
  "debitamount",
];
const CREDIT_HEADERS = [
  "credit",
  "credits",
  "deposit",
  "deposits",
  "moneyin",
  "cr",
  "creditamount",
];
const AMOUNT_HEADERS = ["amount", "value", "transactionamount", "amountngn"];

function findColumn(header: string[], names: string[]): number {
  const keys = header.map(headerKey);
  for (const name of names) {
    const idx = keys.indexOf(name);
    if (idx !== -1) return idx;
  }
  // Fallback: prefix match, e.g. "debitngn"
  for (const name of names) {
    const idx = keys.findIndex((k) => k.startsWith(name) && name.length >= 4);
    if (idx !== -1) return idx;
  }
  return -1;
}

/** Parse "₦12,500.00", "(1,200)", "1.200,50" style cells into a rounded number (0 if empty/invalid). */
export function parseAmountCell(raw: string): number {
  let s = raw.trim();
  if (!s) return 0;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (/^-/.test(s)) {
    negative = true;
  }
  if (/(^|\s)(dr)\.?$/i.test(s)) negative = true;
  s = s.replace(/[^0-9.,]/g, "");
  if (!s) return 0;

  // Decide decimal separator: whichever of . / , appears last,
  // except comma-only values in thousands groups ("1,200" / "1,200,000").
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  let normalized: string;
  if (lastDot === -1 && lastComma === -1) {
    normalized = s;
  } else if (lastDot > lastComma || /^\d{1,3}(,\d{3})+$/.test(s)) {
    normalized = s.replaceAll(",", "");
  } else {
    normalized = s.replaceAll(".", "").replace(",", ".");
  }
  const n = Number(normalized);
  if (!Number.isFinite(n)) return 0;
  const rounded = Math.round(Math.abs(n));
  return negative ? -rounded : rounded;
}

const MONTH_WORDS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function fullYear(y: number): number {
  if (y >= 100) return y;
  return y >= 70 ? 1900 + y : 2000 + y;
}

/** Parse common statement date formats into a MonthId (null if unrecognized). */
export function parseDateCellToMonth(raw: string): MonthId | null {
  const s = raw.trim();
  if (!s) return null;

  // ISO: 2026-03-14 (also 2026/03/14)
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(s);
  if (m) {
    const month = Number(m[2]);
    if (month >= 1 && month <= 12) return formatMonthId(Number(m[1]), month);
  }

  // dd/mm/yyyy or dd-mm-yy (day-first: Nigerian/European bank convention)
  m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/.exec(s);
  if (m) {
    const month = Number(m[2]);
    if (month >= 1 && month <= 12) {
      return formatMonthId(fullYear(Number(m[3])), month);
    }
  }

  // 14 Mar 2026 / 14-Mar-26 / Mar 14, 2026
  m = /^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s,]+(\d{2,4})$/.exec(s);
  if (m) {
    const month = MONTH_WORDS[m[2].slice(0, 3).toLowerCase()];
    if (month) return formatMonthId(fullYear(Number(m[3])), month);
  }
  m = /^([A-Za-z]{3,})[-\s](\d{1,2})[-\s,]+(\d{2,4})$/.exec(s);
  if (m) {
    const month = MONTH_WORDS[m[1].slice(0, 3).toLowerCase()];
    if (month) return formatMonthId(fullYear(Number(m[3])), month);
  }
  return null;
}

/**
 * Parse a bank statement CSV into debit transactions.
 * Throws with a friendly message when required columns can't be found.
 */
export function parseStatementCsv(text: string): StatementParseResult {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    throw new Error(
      "This file doesn't look like a statement — no data rows found.",
    );
  }

  // The header may not be the first row (banks often prepend account info).
  let headerIdx = -1;
  let dateCol = -1;
  let descCol = -1;
  let debitCol = -1;
  let creditCol = -1;
  let amountCol = -1;

  const scanLimit = Math.min(rows.length, 12);
  for (let i = 0; i < scanLimit; i++) {
    const header = rows[i];
    const d = findColumn(header, DATE_HEADERS);
    const desc = findColumn(header, DESC_HEADERS);
    const debit = findColumn(header, DEBIT_HEADERS);
    const amount = findColumn(header, AMOUNT_HEADERS);
    if (d !== -1 && desc !== -1 && (debit !== -1 || amount !== -1)) {
      headerIdx = i;
      dateCol = d;
      descCol = desc;
      debitCol = debit;
      creditCol = findColumn(header, CREDIT_HEADERS);
      amountCol = amount;
      break;
    }
  }

  if (headerIdx === -1) {
    throw new Error(
      "Couldn't find Date, Description, and Debit/Amount columns. Export your statement as CSV from your bank app and try again.",
    );
  }

  const transactions: StatementTransaction[] = [];
  let skippedRows = 0;
  let firstMonth: MonthId | null = null;
  let lastMonth: MonthId | null = null;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const month = parseDateCellToMonth(row[dateCol] ?? "");
    const description = (row[descCol] ?? "").trim();
    if (!month || !description) {
      skippedRows++;
      continue;
    }

    let debit = 0;
    if (debitCol !== -1) {
      debit = Math.abs(parseAmountCell(row[debitCol] ?? ""));
      // Rows with a credit value and no debit are inflows — skip.
      if (debit === 0) {
        const credit =
          creditCol !== -1
            ? Math.abs(parseAmountCell(row[creditCol] ?? ""))
            : 0;
        if (credit > 0) continue;
      }
    } else {
      const signed = parseAmountCell(row[amountCol] ?? "");
      if (signed >= 0) continue; // treat positive as inflow
      debit = Math.abs(signed);
    }
    if (debit <= 0) {
      skippedRows++;
      continue;
    }

    transactions.push({ month, description, debit });
    if (!firstMonth || month < firstMonth) firstMonth = month;
    if (!lastMonth || month > lastMonth) lastMonth = month;
  }

  if (transactions.length === 0) {
    throw new Error(
      "No debit transactions found in this file. Check that the export includes withdrawals.",
    );
  }

  return { transactions, firstMonth, lastMonth, skippedRows };
}

// ---------------------------------------------------------------------------
// PDF (text-layer) statement parsing
// ---------------------------------------------------------------------------

/** "01-NOV-25", "01/11/2025", "14 Mar 2026"-as-one-token style date tokens. */
function isDateToken(token: string): boolean {
  return (
    /^\d{1,2}[-/][A-Za-z]{3,}[-/]\d{2,4}$/.test(token) ||
    /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(token)
  );
}

/**
 * Money cell in a statement table tail: "2,500.00", "-97.58" or the empty
 * placeholder "-". Requires decimals so bare reference numbers in narrations
 * (e.g. "229241973") never terminate a row early.
 */
function isMoneyOrDashToken(token: string): boolean {
  return token === "-" || /^-?(?:\d{1,3}(?:,\d{3})+|\d+)\.\d{1,2}$/.test(token);
}

function isMoneyToken(token: string): boolean {
  return token !== "-" && isMoneyOrDashToken(token);
}

/** Page furniture that should never join a transaction row. */
function isNoiseLine(line: string): boolean {
  return (
    /^-*\s*\d+\s+of\s+\d+\s*-*$/i.test(line) || // "-- 3 of 20 --"
    /^Posted\s+Date\b/i.test(line) || // repeated table header
    /^This is an automated/i.test(line)
  );
}

/**
 * Parse visual text lines (from a PDF text layer) shaped like:
 *   PostedDate ValueDate Description... Debit Credit Balance
 *
 * Rows can wrap across several visual lines, and because table cells are
 * vertically centered, wrapped description fragments may appear before or
 * after the line carrying the dates and amounts. So: a line starting with a
 * date opens a row, every line until the next date-anchored line belongs to
 * it, and the Debit/Credit/Balance tail is located by scanning the row's
 * tokens from the end.
 */
export function parseStatementTextLines(lines: string[]): StatementParseResult {
  const transactions: StatementTransaction[] = [];
  let skippedRows = 0;
  let firstMonth: MonthId | null = null;
  let lastMonth: MonthId | null = null;

  const finalizeRow = (tokens: string[]) => {
    const month = parseDateCellToMonth(tokens[0]);
    if (!month) {
      skippedRows++;
      return;
    }

    // Locate the amounts tail: last [debit|-] [credit|-] [balance] triple.
    let tailAt = -1;
    for (let k = tokens.length - 1; k >= 4; k--) {
      if (
        isMoneyToken(tokens[k]) &&
        isMoneyOrDashToken(tokens[k - 1]) &&
        isMoneyOrDashToken(tokens[k - 2])
      ) {
        tailAt = k - 2;
        break;
      }
    }
    if (tailAt === -1) {
      skippedRows++;
      return;
    }

    const debitTok = tokens[tailAt];
    const descStart = isDateToken(tokens[1] ?? "") ? 2 : 1;
    const description = [
      ...tokens.slice(descStart, tailAt),
      ...tokens.slice(tailAt + 3),
    ]
      .join(" ")
      .trim();

    // Credits and reversals are inflows/refunds — not spending.
    const debit = debitTok === "-" ? 0 : parseAmountCell(debitTok);
    if (debit > 0 && description) {
      transactions.push({ month, description, debit });
      if (!firstMonth || month < firstMonth) firstMonth = month;
      if (!lastMonth || month > lastMonth) lastMonth = month;
    } else {
      skippedRows++;
    }
  };

  let pending: string[] | null = null;
  for (const line of lines) {
    if (isNoiseLine(line)) continue;
    const tokens = line.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;

    if (isDateToken(tokens[0])) {
      if (pending) finalizeRow(pending);
      pending = tokens;
    } else if (pending) {
      if (pending.length < 80) pending = pending.concat(tokens);
    }
    // Lines before the first date row are header noise — ignored.
  }
  if (pending) finalizeRow(pending);

  if (transactions.length === 0) {
    throw new Error(
      "No transaction rows found in this statement. If it's a scanned or image-only PDF, ask your bank app for a CSV export instead.",
    );
  }

  return { transactions, firstMonth, lastMonth, skippedRows };
}

/** Parse a PDF bank statement (text layer) into debit transactions. */
export function parseStatementPdf(bytes: Uint8Array): StatementParseResult {
  const lines = extractPdfTextLines(bytes);
  if (lines.length === 0) {
    throw new Error(
      "Couldn't read text from this PDF. It may be scanned or password-protected — try removing the password or exporting a CSV from your bank app.",
    );
  }
  return parseStatementTextLines(lines);
}

const NOISE_WORDS = new Set([
  "ref",
  "trf",
  "tfr",
  "nip",
  "ussd",
  "pos",
  "web",
  "via",
  "the",
  "payment",
  "pmt",
  "purchase",
  "trx",
  "txn",
  "transaction",
  // Nigerian statement narration noise
  "pymt",
  "bills",
  "mobile",
  "pay",
  "to",
  "from",
  "lang",
  "pstk",
  "ng",
  "us",
  "ie",
]);

/** Normalize a narration into a grouping key: letters only, noise words removed, first 4 tokens. */
export function normalizeDescription(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z]+/g, " ")
    .split(" ")
    .filter((w) => w.length >= 2 && !NOISE_WORDS.has(w.toLowerCase()))
    .slice(0, 4)
    .join(" ")
    .trim();
}

function titleCase(key: string): string {
  return key
    .toLowerCase()
    .split(" ")
    .map((w) =>
      w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1),
    )
    .join(" ");
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

/**
 * Bank fees (VAT, commission, stamp duty, SMS alerts) recur constantly but
 * aren't bills the user plans around — filter suggestions below this amount.
 */
const MIN_SUGGESTION_AMOUNT = 1000;

/**
 * Detect recurring debits: same normalized narration in ≥2 distinct months,
 * with at least 2 amounts within ±30% of the group median.
 */
export function suggestBillsFromTransactions(
  transactions: StatementTransaction[],
): BillSuggestion[] {
  const groups = new Map<string, StatementTransaction[]>();
  for (const tx of transactions) {
    const key = normalizeDescription(tx.description);
    if (!key) continue;
    const list = groups.get(key);
    if (list) list.push(tx);
    else groups.set(key, [tx]);
  }

  const suggestions: BillSuggestion[] = [];
  for (const [key, txs] of groups) {
    const months = new Set(txs.map((t) => t.month));
    if (months.size < 2) continue;

    const amounts = txs.map((t) => t.debit).sort((a, b) => a - b);
    const med = median(amounts);
    if (med <= 0) continue;
    const stable = amounts.filter((a) => Math.abs(a - med) / med <= 0.3);
    if (stable.length < 2) continue;

    const amount = median(stable.slice().sort((a, b) => a - b));
    if (amount < MIN_SUGGESTION_AMOUNT) continue;

    suggestions.push({
      key,
      label: titleCase(key),
      amount,
      occurrences: txs.length,
      monthsSeen: months.size,
    });
  }

  return suggestions.sort((a, b) => b.amount - a.amount);
}
