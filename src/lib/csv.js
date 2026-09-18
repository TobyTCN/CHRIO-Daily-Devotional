import Papa from "papaparse";
import { iso, MONTHS, fmtFull } from "./dates.js";

export const FIELDS = ["date", "title", "scripture", "reference", "message", "prayer", "declaration", "further_reading", "author"];

// Column names are matched loosely: "Bible Reference", "memory_verse", "PRAYER POINT" all work.
const ALIASES = {
  date: ["date", "day", "devotionaldate", "dateofdevotional"],
  title: ["title", "topic", "theme", "heading", "subject"],
  scripture: ["scripture", "scripturetext", "verse", "memoryverse", "keyverse", "bibleverse", "versetext", "text", "anchorverse"],
  reference: ["reference", "scripturereference", "biblereference", "ref", "versereference", "passage", "scriptureref"],
  message: ["message", "body", "devotional", "content", "devotion", "meditation", "exhortation", "word"],
  prayer: ["prayer", "prayerpoint", "prayerpoints", "prayers"],
  declaration: ["declaration", "confession", "affirmation", "confessions", "declarations"],
  further_reading: ["furtherreading", "biblereading", "dailyreading", "bibleinoneyear", "bibleplan", "furtherstudy", "reading", "readmore"],
  author: ["author", "writer", "by", "writtenby"],
};
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function mapHeaders(headers) {
  const map = {};
  for (const h of headers) {
    const n = norm(h);
    for (const f of FIELDS) {
      if (!map[f] && ALIASES[f].includes(n)) { map[f] = h; break; }
    }
  }
  return map;
}

function validDate(y, m, d) {
  if (!(y > 1900 && y < 2200 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  const dt = new Date(y, m - 1, d);
  return dt.getMonth() === m - 1 ? iso(dt) : null;
}
function monthNumber(name) {
  const n = name.toLowerCase().slice(0, 3);
  const i = MONTHS.findIndex((m) => m.toLowerCase().slice(0, 3) === n);
  return i < 0 ? null : i + 1;
}

/** Accepts 2026-09-18, 18/09/2026, 09/18/2026 (fmt "mdy"), 18 Sept 2026, September 18, 2026, 18-Sep-26, spreadsheet serials. */
export function parseDate(raw, fmt = "dmy") {
  const s = String(raw || "").trim().replace(/(\d)(st|nd|rd|th)\b/gi, "$1");
  let m;
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/))) return validDate(+m[1], +m[2], +m[3]);
  if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/))) {
    const a = +m[1], b = +m[2];
    let y = +m[3];
    if (y < 100) y += 2000;
    let day, mon;
    if (a > 12) { day = a; mon = b; }
    else if (b > 12) { day = b; mon = a; }
    else if (fmt === "mdy") { mon = a; day = b; }
    else { day = a; mon = b; }
    return validDate(y, mon, day);
  }
  if ((m = s.match(/^(?:[A-Za-z]+,?\s+)?(\d{1,2})[\s-]+([A-Za-z]+)\.?[\s,-]+(\d{2,4})$/))) {
    const mon = monthNumber(m[2]);
    let y = +m[3];
    if (y < 100) y += 2000;
    return mon ? validDate(y, mon, +m[1]) : null;
  }
  if ((m = s.match(/^(?:[A-Za-z]+,?\s+)?([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/))) {
    const mon = monthNumber(m[1]);
    return mon ? validDate(+m[3], mon, +m[2]) : null;
  }
  if ((m = s.match(/^(\d{5})(\.\d+)?$/))) {
    const base = new Date(1899, 11, 30);
    base.setDate(base.getDate() + +m[1]);
    return iso(base);
  }
  return null;
}

export function readCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.replace(/^\uFEFF/, "").trim(),
      complete: (res) => resolve({ headers: res.meta.fields || [], rows: res.data }),
      error: reject,
    });
  });
}

/** Turns raw CSV rows into clean devotional rows, with a list of problems to show the admin. */
export function prepareRows({ headers, rows }, fmt) {
  const map = mapHeaders(headers);
  if (!map.date) return { fatal: `No date column found. Columns in this file: ${headers.join(", ")}. Rename one of them to "date".` };
  if (!map.message) return { fatal: `No message column found. Columns in this file: ${headers.join(", ")}. Rename the devotional text column to "message".` };

  const issues = [];
  const byDate = new Map();
  rows.forEach((r, i) => {
    const line = i + 2;
    const get = (f) => (map[f] ? String(r[map[f]] ?? "").trim() : "");
    if (Object.values(r).every((v) => !String(v ?? "").trim())) return;
    const rawDate = get("date");
    const date = parseDate(rawDate, fmt);
    if (!date) { issues.push(`Row ${line}: "${rawDate}" is not a date the app can read.`); return; }
    const item = { date };
    for (const f of FIELDS) if (f !== "date") item[f] = get(f);
    if (!item.message) { issues.push(`Row ${line} (${fmtFull(date)}): the message is empty.`); return; }
    if (byDate.has(date)) issues.push(`Row ${line}: ${fmtFull(date)} appears more than once; the last row is used.`);
    byDate.set(date, item);
  });
  const items = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  const used = new Set(Object.values(map));
  return { items, issues, unmatched: headers.filter((h) => !used.has(h)) };
}

export function toCsv(items) {
  return Papa.unparse(items.map((it) => Object.fromEntries(FIELDS.map((f) => [f, it[f] ?? ""]))), { columns: FIELDS });
}

export const TEMPLATE_ROWS = [{
  date: "2026-10-01",
  title: "Abiding in the Vine",
  scripture: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.",
  reference: "John 15:5",
  message: "Write the first paragraph of the devotional here.\n\nPress Alt+Enter (Excel) or Ctrl+Enter (Google Sheets) inside the cell to start a new paragraph.",
  prayer: "Write the prayer here.",
  declaration: "Write the declaration here.",
  further_reading: "John 15:1-17",
  author: "Your name",
}];

export function downloadText(filename, text, type = "text/csv;charset=utf-8") {
  const blob = new Blob(["\uFEFF" + text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
