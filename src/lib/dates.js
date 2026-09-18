export const TIMEZONE = import.meta.env.VITE_TIMEZONE || "Africa/Lagos";
export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const pad = (n) => String(n).padStart(2, "0");
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromIso(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Today's date (YYYY-MM-DD) in the ministry's time zone, so every reader changes day together. */
export function todayIso() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function addDays(s, n) {
  const d = fromIso(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

export const isValidIso = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "") && iso(fromIso(s)) === s;
export const fmtWeekday = (s) => fromIso(s).toLocaleDateString("en-GB", { weekday: "long" });
export const fmtShortWeekday = (s) => fromIso(s).toLocaleDateString("en-GB", { weekday: "short" });
export function fmtFull(s) {
  const d = fromIso(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
export function fmtDayMonth(s) {
  const d = fromIso(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}
export const paragraphs = (t) => String(t || "").replace(/\r/g, "").split(/\n+/).map((p) => p.trim()).filter(Boolean);
