/* eslint-disable no-console */
import { readFileSync } from "node:fs";

import { extractPdfTextLines } from "../src/lib/pdfText";
import {
  parseStatementTextLines,
  suggestBillsFromTransactions,
} from "../src/lib/statementImport";

const path = process.argv[2];
if (!path) {
  console.error("usage: tsx scripts/pdf-smoke.ts <statement.pdf>");
  process.exit(1);
}

const bytes = new Uint8Array(readFileSync(path));
const lines = extractPdfTextLines(bytes);
console.log(`extracted ${lines.length} text lines`);
console.log("--- first 30 lines ---");
for (const l of lines.slice(0, 30)) console.log(JSON.stringify(l));

const result = parseStatementTextLines(lines);
console.log(`\ntransactions: ${result.transactions.length}`);
console.log(`range: ${result.firstMonth} → ${result.lastMonth}`);
console.log(`skipped rows: ${result.skippedRows}`);
const totalDebits = result.transactions.reduce((s, t) => s + t.debit, 0);
console.log(`total debits: ${totalDebits.toLocaleString()}`);
console.log("--- sample transactions ---");
for (const t of result.transactions.slice(0, 8)) {
  console.log(
    `${t.month}  ${t.debit.toString().padStart(10)}  ${t.description.slice(0, 60)}`,
  );
}

const suggestions = suggestBillsFromTransactions(result.transactions);
console.log(`\nsuggestions: ${suggestions.length}`);
for (const s of suggestions) {
  console.log(
    `₦${s.amount.toLocaleString().padStart(10)}  ×${s.occurrences} in ${s.monthsSeen} months  ${s.label}`,
  );
}
