/** Pull plausible naira amounts from a single line (commas as thousands). */
function numbersFromLine(line: string): number[] {
  const out: number[] = [];
  const re = /(?:₦|NGN|ngn\.?)\s*([\d][\d,\s]*\.?\d{0,2})|([\d][\d,\s]*\.?\d{0,2})\s*(?:₦|NGN)/gi;
  let m: RegExpExecArray | null;
  const s = line;
  while ((m = re.exec(s)) !== null) {
    const raw = (m[1] ?? m[2] ?? '').replace(/\s/g, '').replace(/,/g, '');
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n) && n > 0) out.push(Math.round(n));
  }
  const loose = s.match(/\b\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?\b|\b\d{4,}\b(?:\.\d{1,2})?\b/g);
  if (loose) {
    for (const t of loose) {
      const raw = t.replace(/,/g, '');
      const n = Number.parseFloat(raw);
      if (Number.isFinite(n) && n >= 100 && n < 500_000_000) out.push(Math.round(n));
    }
  }
  return out;
}

function lineWeight(line: string): number {
  const low = line.toLowerCase();
  if (/grand\s*total|amount\s*due|balance\s*due|total\s*due|total\s*payable|pay\s*this\s*amount/i.test(low)) return 100;
  if (/^total\b|total\s*:|total\s*=|\btotal\s*₦|\btotal\s*ngn/i.test(low) && !/subtotal/i.test(low)) return 85;
  if (/\btotal\b/.test(low) && !/subtotal/i.test(low)) return 70;
  if (/you\s*pay|amount\s*payable|sum\s*total/i.test(low)) return 65;
  if (/balance|change|cash/i.test(low)) return 40;
  if (/subtotal|tax\b|vat\b|discount/i.test(low)) return 25;
  return 10;
}

/**
 * Best-effort total from OCR’d receipt text (Nigeria-style ₦ / NGN / comma thousands).
 */
export function parseReceiptAmountFromText(text: string): number | null {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let best: { n: number; w: number } | null = null;

  for (const line of lines) {
    const nums = numbersFromLine(line);
    if (nums.length === 0) continue;
    const w = lineWeight(line);
    const n = Math.max(...nums);
    if (!best || w > best.w || (w === best.w && n > best.n)) {
      best = { n, w };
    }
  }

  if (best && best.w >= 65) return best.n;

  const pool: number[] = [];
  for (const line of lines) {
    pool.push(...numbersFromLine(line));
  }
  const year = new Date().getFullYear();
  const plausible = pool.filter((n) => n >= 50 && n < 500_000_000 && n !== year && n !== year % 100);
  if (plausible.length === 0) return null;
  return Math.max(...plausible);
}

const SKIP_LINE =
  /^(receipt|invoice|tax\s*invoice|date|time|tel|phone|\+?\d|www\.|http|thank|cashier|pos|terminal|tin|rc\s|bn\s)/i;

/** First non-metadata line as merchant / description. */
export function guessReceiptLabelFromText(text: string): string {
  const lines = text.split(/\n/).map((l) => l.trim());
  for (const line of lines) {
    if (line.length < 2 || line.length > 80) continue;
    if (SKIP_LINE.test(line)) continue;
    if (/^\d{1,2}[\/\-]\d{1,2}/.test(line)) continue;
    if (/^[=*\-_.\s]+$/i.test(line)) continue;
    if (/^\d+\s*$/.test(line)) continue;
    return line.slice(0, 72);
  }
  return 'Receipt';
}
