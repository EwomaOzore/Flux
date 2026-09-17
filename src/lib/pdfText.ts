import { inflate } from "pako";

/**
 * Minimal on-device PDF text extraction for digitally generated documents
 * (e.g. Nigerian bank statements, which are typically produced by web apps
 * printing to PDF). No rendering, no OCR, no network.
 *
 * Strategy:
 * 1. Index all objects and inflate FlateDecode streams.
 * 2. Build ToUnicode CMaps (glyph code → text) for embedded subset fonts.
 * 3. Interpret text operators (Tj/TJ/'/"), decoding strings through the
 *    active font's CMap and tracking the vertical position, then regroup
 *    runs into visual lines.
 *
 * Not supported: encrypted PDFs and scanned image-only PDFs. Callers should
 * fall back with a friendly error when no text comes back.
 */

type Cmap = {
  readonly codeBytes: 1 | 2;
  readonly map: Map<number, string>;
};

type Run = {
  readonly y: number;
  readonly order: number;
  readonly text: string;
};

type NameOperand = { readonly name: string };
type Operand = number | string | NameOperand | (number | string)[];

const B64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Decode base64 into bytes without relying on global atob/Buffer. */
export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, "");
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i + 1 < clean.length; i += 4) {
    const a = B64_ALPHABET.indexOf(clean[i]);
    const b = B64_ALPHABET.indexOf(clean[i + 1]);
    const c = i + 2 < clean.length ? B64_ALPHABET.indexOf(clean[i + 2]) : -1;
    const d = i + 3 < clean.length ? B64_ALPHABET.indexOf(clean[i + 3]) : -1;
    out[o++] = (a << 2) | (b >> 4);
    if (c !== -1) out[o++] = ((b & 15) << 4) | (c >> 2);
    if (d !== -1) out[o++] = ((c & 3) << 6) | d;
  }
  return out.subarray(0, o);
}

function latin1(bytes: Uint8Array, start = 0, end = bytes.length): string {
  let out = "";
  const CHUNK = 8192;
  for (let i = start; i < end; i += CHUNK) {
    const slice = bytes.subarray(i, Math.min(end, i + CHUNK));
    out += String.fromCharCode(...slice);
  }
  return out;
}

function toBytes(str: string): Uint8Array {
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
  return out;
}

/** Decode a PDF literal string body (between parens) honoring escapes. */
function decodeLiteralString(body: string): string {
  let out = "";
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const next = body[++i];
    switch (next) {
      case "n":
        out += "\n";
        break;
      case "r":
        out += "\r";
        break;
      case "t":
        out += "\t";
        break;
      case "b":
        out += "\b";
        break;
      case "f":
        out += "\f";
        break;
      case "(":
        out += "(";
        break;
      case ")":
        out += ")";
        break;
      case "\\":
        out += "\\";
        break;
      case "\r":
        if (body[i + 1] === "\n") i++;
        break; // line continuation
      case "\n":
        break;
      default: {
        if (next >= "0" && next <= "7") {
          let oct = next;
          for (
            let k = 0;
            k < 2 && body[i + 1] >= "0" && body[i + 1] <= "7";
            k++
          ) {
            oct += body[++i];
          }
          out += String.fromCharCode(Number.parseInt(oct, 8) & 0xff);
        } else if (next !== undefined) {
          out += next;
        }
      }
    }
  }
  return out;
}

/** Raw bytes of a hex string: each pair of hex digits is one byte. */
function decodeHexString(body: string): string {
  const hex = body.replace(/[^0-9a-fA-F]/g, "");
  let out = "";
  for (let i = 0; i + 1 < hex.length; i += 2) {
    out += String.fromCharCode(Number.parseInt(hex.slice(i, i + 2), 16));
  }
  if (hex.length % 2 === 1) {
    out += String.fromCharCode(Number.parseInt(`${hex[hex.length - 1]}0`, 16));
  }
  return out;
}

/** UTF-16BE hex (as found in ToUnicode bfchar/bfrange targets) → string. */
function utf16beFromHex(hex: string): string {
  let out = "";
  for (let i = 0; i + 3 < hex.length; i += 4) {
    out += String.fromCharCode(Number.parseInt(hex.slice(i, i + 4), 16));
  }
  return out;
}

/** Parse a ToUnicode CMap stream into a code → text map. */
function parseCmap(text: string): Cmap | null {
  const map = new Map<number, string>();
  let codeBytes: 1 | 2 = 2;
  let sawAny = false;

  const charRe = /beginbfchar([\s\S]*?)endbfchar/g;
  let section: RegExpExecArray | null;
  while ((section = charRe.exec(text)) !== null) {
    const pairRe = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
    let pair: RegExpExecArray | null;
    while ((pair = pairRe.exec(section[1])) !== null) {
      sawAny = true;
      if (pair[1].length <= 2) codeBytes = 1;
      map.set(Number.parseInt(pair[1], 16), utf16beFromHex(pair[2]));
    }
  }

  const rangeRe = /beginbfrange([\s\S]*?)endbfrange/g;
  while ((section = rangeRe.exec(text)) !== null) {
    const body = section[1];
    // <lo> <hi> <dst>  — consecutive mapping
    const simpleRe = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
    let m: RegExpExecArray | null;
    while ((m = simpleRe.exec(body)) !== null) {
      sawAny = true;
      if (m[1].length <= 2) codeBytes = 1;
      const lo = Number.parseInt(m[1], 16);
      const hi = Number.parseInt(m[2], 16);
      const dstBase = Number.parseInt(m[3].slice(-4), 16);
      const prefix = utf16beFromHex(m[3].slice(0, -4));
      for (let c = lo; c <= hi && c - lo < 65536; c++) {
        map.set(c, prefix + String.fromCharCode(dstBase + (c - lo)));
      }
    }
    // <lo> <hi> [<d1> <d2> ...] — explicit array mapping
    const arrayRe = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*\[([^\]]*)\]/g;
    while ((m = arrayRe.exec(body)) !== null) {
      sawAny = true;
      if (m[1].length <= 2) codeBytes = 1;
      const lo = Number.parseInt(m[1], 16);
      const dsts = m[3].match(/<([0-9a-fA-F]+)>/g) ?? [];
      for (let k = 0; k < dsts.length; k++) {
        map.set(lo + k, utf16beFromHex(dsts[k].slice(1, -1)));
      }
    }
  }

  return sawAny ? { codeBytes, map } : null;
}

/** Decode a raw (glyph-code) string through a CMap; identity when absent. */
function decodeText(rawStr: string, cmap: Cmap | null): string {
  if (!cmap) return rawStr;
  let out = "";
  if (cmap.codeBytes === 2) {
    for (let i = 0; i + 1 < rawStr.length; i += 2) {
      const code = (rawStr.charCodeAt(i) << 8) | rawStr.charCodeAt(i + 1);
      out += cmap.map.get(code) ?? "";
    }
  } else {
    for (let i = 0; i < rawStr.length; i++) {
      out += cmap.map.get(rawStr.charCodeAt(i)) ?? rawStr[i];
    }
  }
  return out;
}

function printableRatio(s: string): number {
  if (!s.length) return 0;
  let printable = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if ((c >= 0x20 && c < 0x7f) || c === 0x09 || c >= 0xa0) printable++;
  }
  return printable / s.length;
}

/** Interpret text operators in one content stream, returning positioned runs. */
function runsFromContentStream(
  content: string,
  cmapForFont: (fontName: string) => Cmap | null,
): Run[] {
  const runs: Run[] = [];
  let y = 0;
  let leading = 0;
  let order = 0;
  let cmap: Cmap | null = null;
  const operands: Operand[] = [];
  let i = 0;
  const n = content.length;

  // Text shown at the same baseline inside one BT block is a single segment:
  // generators (notably Chrome/Skia) split runs mid-word for kerning, while
  // genuine spaces are present as space glyphs. Segments are flushed when
  // the baseline moves or the text block ends.
  let segText = "";
  let segY = 0;

  const flushSegment = () => {
    if (segText) {
      runs.push({
        y: Math.round(segY * 10) / 10,
        order: order++,
        text: segText,
      });
    }
    segText = "";
  };

  const appendText = (decoded: string) => {
    if (!decoded) return;
    if (!segText) segY = y;
    segText += decoded;
  };

  const moveY = (newY: number) => {
    if (Math.abs(newY - y) > 0.1) flushSegment();
    y = newY;
  };

  const lastNumbers = (count: number): number[] => {
    const nums: number[] = [];
    for (let k = operands.length - 1; k >= 0 && nums.length < count; k--) {
      const v = operands[k];
      if (typeof v === "number") nums.unshift(v);
    }
    return nums;
  };

  const lastString = (): string | null => {
    for (let k = operands.length - 1; k >= 0; k--) {
      const v = operands[k];
      if (typeof v === "string") return v;
    }
    return null;
  };

  const lastName = (): string | null => {
    for (let k = operands.length - 1; k >= 0; k--) {
      const v = operands[k];
      if (typeof v === "object" && !Array.isArray(v)) return v.name;
    }
    return null;
  };

  const joinTJ = (arr: (number | string)[]): string => {
    let raw = "";
    let out = "";
    const flush = () => {
      out += decodeText(raw, cmap);
      raw = "";
    };
    for (const item of arr) {
      if (typeof item === "string") raw += item;
      else if (item <= -250) {
        flush();
        out += " "; // word-gap-sized negative adjustment
      }
    }
    flush();
    return out;
  };

  const parseLiteralAt = (start: number): { value: string; end: number } => {
    let depth = 1;
    let j = start + 1;
    let body = "";
    while (j < n && depth > 0) {
      const c = content[j];
      if (c === "\\") {
        body += c + (content[j + 1] ?? "");
        j += 2;
        continue;
      }
      if (c === "(") depth++;
      else if (c === ")") {
        depth--;
        if (depth === 0) break;
      }
      body += c;
      j++;
    }
    return { value: decodeLiteralString(body), end: j + 1 };
  };

  while (i < n) {
    const ch = content[i];

    if (
      ch === " " ||
      ch === "\n" ||
      ch === "\r" ||
      ch === "\t" ||
      ch === "\f" ||
      ch === "\0"
    ) {
      i++;
      continue;
    }

    if (ch === "%") {
      // comment to EOL
      while (i < n && content[i] !== "\n" && content[i] !== "\r") i++;
      continue;
    }

    if (ch === "(") {
      const lit = parseLiteralAt(i);
      operands.push(lit.value);
      i = lit.end;
      continue;
    }

    if (ch === "<") {
      if (content[i + 1] === "<") {
        // dictionary — skip balanced
        let depth = 1;
        let j = i + 2;
        while (j < n && depth > 0) {
          if (content[j] === "<" && content[j + 1] === "<") {
            depth++;
            j += 2;
            continue;
          }
          if (content[j] === ">" && content[j + 1] === ">") {
            depth--;
            j += 2;
            continue;
          }
          j++;
        }
        i = j;
        continue;
      }
      const close = content.indexOf(">", i + 1);
      if (close === -1) break;
      operands.push(decodeHexString(content.slice(i + 1, close)));
      i = close + 1;
      continue;
    }

    if (ch === "[") {
      const arr: (number | string)[] = [];
      let j = i + 1;
      while (j < n && content[j] !== "]") {
        const c = content[j];
        if (c === "(") {
          const lit = parseLiteralAt(j);
          arr.push(lit.value);
          j = lit.end;
          continue;
        }
        if (c === "<") {
          const close = content.indexOf(">", j + 1);
          if (close === -1) break;
          arr.push(decodeHexString(content.slice(j + 1, close)));
          j = close + 1;
          continue;
        }
        const numMatch = /^[-+]?(?:\d+\.?\d*|\.\d+)/.exec(
          content.slice(j, j + 24),
        );
        if (numMatch) {
          arr.push(Number(numMatch[0]));
          j += numMatch[0].length;
          continue;
        }
        j++;
      }
      operands.push(arr);
      i = j + 1;
      continue;
    }

    if (ch === "/") {
      // name
      let j = i + 1;
      while (j < n && !/[\s()<>[\]{}/%]/.test(content[j])) j++;
      operands.push({ name: content.slice(i + 1, j) });
      i = j;
      continue;
    }

    if ((ch >= "0" && ch <= "9") || ch === "-" || ch === "+" || ch === ".") {
      const numMatch = /^[-+]?(?:\d+\.?\d*|\.\d+)/.exec(
        content.slice(i, i + 24),
      );
      if (numMatch) {
        operands.push(Number(numMatch[0]));
        i += numMatch[0].length;
        continue;
      }
      i++;
      continue;
    }

    // Operator token
    let j = i;
    while (j < n && /[A-Za-z'"*01]/.test(content[j])) j++;
    const op = content.slice(i, Math.max(j, i + 1));
    i = Math.max(j, i + 1);

    switch (op) {
      case "BT":
      case "ET":
        flushSegment();
        if (op === "BT") {
          y = 0;
          leading = 0;
        }
        break;
      case "Tf": {
        const name = lastName();
        if (name) cmap = cmapForFont(name);
        break;
      }
      case "Tm": {
        const nums = lastNumbers(6);
        if (nums.length === 6) moveY(nums[5]);
        break;
      }
      case "Td": {
        const nums = lastNumbers(2);
        if (nums.length === 2) moveY(y + nums[1]);
        break;
      }
      case "TD": {
        const nums = lastNumbers(2);
        if (nums.length === 2) {
          moveY(y + nums[1]);
          leading = -nums[1];
        }
        break;
      }
      case "TL": {
        const nums = lastNumbers(1);
        if (nums.length === 1) leading = nums[0];
        break;
      }
      case "T*":
        moveY(y - leading);
        break;
      case "Tj": {
        const s = lastString();
        if (s !== null) appendText(decodeText(s, cmap));
        break;
      }
      case "'":
      case '"': {
        moveY(y - leading);
        const s = lastString();
        if (s !== null) appendText(decodeText(s, cmap));
        break;
      }
      case "TJ": {
        const arr = operands[operands.length - 1];
        if (Array.isArray(arr)) appendText(joinTJ(arr));
        break;
      }
      case "BI": {
        // inline image — skip to EI
        const end = content.indexOf("EI", i);
        i = end === -1 ? n : end + 2;
        break;
      }
      default:
        break;
    }
    operands.length = 0;
  }

  flushSegment();
  return runs;
}

/** Group positioned runs into visual text lines (top-to-bottom). */
function linesFromRuns(runs: Run[]): string[] {
  if (runs.length === 0) return [];
  const groups = new Map<number, Run[]>();
  for (const run of runs) {
    let placed = false;
    for (const key of groups.keys()) {
      if (Math.abs(key - run.y) <= 2) {
        groups.get(key)!.push(run);
        placed = true;
        break;
      }
    }
    if (!placed) groups.set(run.y, [run]);
  }
  // Order lines by first emission order, not y: generators write text in
  // reading order, and some (Skia/Chrome) use flipped coordinate systems.
  return [...groups.values()]
    .sort((a, b) => a[0].order - b[0].order)
    .map((group) =>
      group
        .sort((a, b) => a.order - b.order)
        .map((r) => r.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((line) => line.length > 0);
}

type IndexedObject = {
  readonly num: number;
  readonly body: string;
  /** Decompressed stream content, when the object has a readable stream. */
  readonly streamContent: string | null;
};

function extractStreamContent(body: string): string | null {
  const streamMatch = /stream\r?\n/.exec(body);
  if (!streamMatch) return null;
  const dict = body.slice(0, streamMatch.index);
  if (/\/Subtype\s*\/Image/.test(dict)) return null;
  const isFlate = /\/FlateDecode/.test(dict);
  if (!isFlate && /\/Filter/.test(dict)) return null; // DCT/CCITT etc.

  const dataStart = streamMatch.index + streamMatch[0].length;
  let searchFrom = dataStart;
  for (let attempt = 0; attempt < 4; attempt++) {
    const end = body.indexOf("endstream", searchFrom);
    if (end === -1) return null;
    let bodyEnd = end;
    if (body[bodyEnd - 1] === "\n") bodyEnd--;
    if (body[bodyEnd - 1] === "\r") bodyEnd--;
    const data = body.slice(dataStart, bodyEnd);
    if (!isFlate) return data;
    try {
      return latin1(inflate(toBytes(data)));
    } catch {
      searchFrom = end + 9;
    }
  }
  return null;
}

function indexObjects(raw: string): IndexedObject[] {
  const objects: IndexedObject[] = [];
  const objRe = /(\d+)\s+\d+\s+obj\b/g;
  let m: RegExpExecArray | null;
  while ((m = objRe.exec(raw)) !== null) {
    const start = m.index + m[0].length;
    const end = raw.indexOf("endobj", start);
    const body = raw.slice(start, end === -1 ? raw.length : end);
    objects.push({
      num: Number(m[1]),
      body,
      streamContent: extractStreamContent(body),
    });
    if (end !== -1) objRe.lastIndex = end + 6;
  }
  return objects;
}

/**
 * Extract visual text lines from a PDF's text layer.
 * Returns [] when nothing extractable (scanned or encrypted document).
 */
export function extractPdfTextLines(bytes: Uint8Array): string[] {
  const raw = latin1(bytes);
  const objects = indexObjects(raw);
  const byNum = new Map(objects.map((o) => [o.num, o]));

  // ToUnicode CMaps by object number.
  const cmaps = new Map<number, Cmap>();
  for (const obj of objects) {
    if (obj.streamContent && /beginbf(?:char|range)/.test(obj.streamContent)) {
      const cmap = parseCmap(obj.streamContent);
      if (cmap) cmaps.set(obj.num, cmap);
    }
  }

  // Font object → its ToUnicode CMap.
  const fontCmaps = new Map<number, Cmap>();
  for (const obj of objects) {
    if (!/\/Type\s*\/Font/.test(obj.body)) continue;
    const toUni = /\/ToUnicode\s+(\d+)\s+\d+\s+R/.exec(obj.body);
    if (toUni) {
      const cmap = cmaps.get(Number(toUni[1]));
      if (cmap) fontCmaps.set(obj.num, cmap);
    }
  }

  // Resource font name (e.g. "F4") → font object number.
  const fontNames = new Map<string, number>();
  const fontDictRe = /\/Font\s*<</g;
  let fm: RegExpExecArray | null;
  while ((fm = fontDictRe.exec(raw)) !== null) {
    let depth = 1;
    let j = fm.index + fm[0].length;
    const start = j;
    while (j < raw.length && depth > 0) {
      if (raw[j] === "<" && raw[j + 1] === "<") {
        depth++;
        j += 2;
        continue;
      }
      if (raw[j] === ">" && raw[j + 1] === ">") {
        depth--;
        j += 2;
        continue;
      }
      j++;
    }
    const inner = raw.slice(start, j);
    const entryRe = /\/([^\s/<>[\]()]+)\s+(\d+)\s+\d+\s+R/g;
    let entry: RegExpExecArray | null;
    while ((entry = entryRe.exec(inner)) !== null) {
      if (!fontNames.has(entry[1])) fontNames.set(entry[1], Number(entry[2]));
    }
  }

  const cmapForFont = (fontName: string): Cmap | null => {
    const objNum = fontNames.get(fontName);
    if (objNum === undefined) return null;
    let cmap = fontCmaps.get(objNum) ?? null;
    if (!cmap) {
      // Type0 fonts often nest: /DescendantFonts [N 0 R] — ToUnicode
      // usually sits on the parent, but check the descendant too.
      const parent = byNum.get(objNum);
      const desc = parent
        ? /\/DescendantFonts\s*\[?\s*(\d+)\s+\d+\s+R/.exec(parent.body)
        : null;
      if (desc) cmap = fontCmaps.get(Number(desc[1])) ?? null;
    }
    return cmap;
  };

  const lines: string[] = [];
  for (const obj of objects) {
    const content = obj.streamContent;
    if (!content || !/\bBT\b/.test(content)) continue;
    if (/beginbf(?:char|range)/.test(content)) continue; // a CMap, not a page
    const runs = runsFromContentStream(content, cmapForFont).filter(
      (r) => printableRatio(r.text) > 0.6,
    );
    lines.push(...linesFromRuns(runs));
  }

  return lines;
}
