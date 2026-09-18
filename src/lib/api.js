import { supabase } from "./supabase.js";

const INDEX_COLS = "date,title,reference";

export async function getDevotional(date) {
  const { data, error } = await supabase.from("devotionals").select("*").eq("date", date).maybeSingle();
  if (error) throw error;
  return data;
}

/** Nearest devotional before / after a date. Readers only ever see up to today (enforced by the database). */
export async function getNeighbours(date) {
  const [prev, next] = await Promise.all([
    supabase.from("devotionals").select("date").lt("date", date).order("date", { ascending: false }).limit(1),
    supabase.from("devotionals").select("date").gt("date", date).order("date", { ascending: true }).limit(1),
  ]);
  return { prev: prev.data?.[0]?.date || null, next: next.data?.[0]?.date || null };
}

/** Every devotional's date, title and reference, newest first. */
export async function listIndex(cols = INDEX_COLS) {
  const out = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase.from("devotionals").select(cols).order("date", { ascending: false }).range(from, from + page - 1);
    if (error) throw error;
    out.push(...data);
    if (data.length < page) break;
  }
  return out;
}

export const listAll = () => listIndex("*");

export async function upsertMany(items, onProgress) {
  const size = 100;
  let done = 0;
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    const { error } = await supabase.from("devotionals").upsert(batch, { onConflict: "date" });
    if (error) throw error;
    done += batch.length;
    onProgress?.(done, items.length);
  }
}

export async function saveDevotional(item, originalDate) {
  const { error } = await supabase.from("devotionals").upsert(item, { onConflict: "date" });
  if (error) throw error;
  if (originalDate && originalDate !== item.date) await deleteDevotional(originalDate);
}

export async function deleteDevotional(date) {
  const { error } = await supabase.from("devotionals").delete().eq("date", date);
  if (error) throw error;
}

export async function existingDates(dates) {
  if (!dates.length) return new Set();
  const { data, error } = await supabase.from("devotionals").select("date").in("date", dates.slice(0, 1000));
  if (error) throw error;
  return new Set(data.map((d) => d.date));
}

export function friendlyError(e) {
  const msg = String(e?.message || e || "");
  if (/row-level security|permission denied|42501/i.test(msg)) return "Your account is not an admin. Ask the owner to add you, then sign in again.";
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return "No connection. Check your internet and try again.";
  if (/JWT|expired/i.test(msg)) return "Your session has expired. Sign in again.";
  return msg || "Something went wrong. Try again.";
}
