import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listIndex } from "../lib/api.js";
import { fromIso, fmtShortWeekday, MONTHS } from "../lib/dates.js";
import { useToday } from "../lib/hooks.js";

export default function Archive() {
  const today = useToday();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");

  const load = () => {
    setError(false);
    listIndex().then(setItems).catch(() => setError(true));
  };
  useEffect(load, []);

  const groups = useMemo(() => {
    if (!items) return [];
    const term = q.trim().toLowerCase();
    const list = term ? items.filter((e) => `${e.title} ${e.reference}`.toLowerCase().includes(term)) : items;
    const map = new Map();
    for (const e of list) {
      const k = e.date.slice(0, 7);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(e);
    }
    return [...map.entries()];
  }, [items, q]);

  return (
    <section>
      <div className="pagehead">
        <h1>Past days</h1>
        <p>Every devotional, newest first. Tap a day to read it.</p>
        <label className="sr-only" htmlFor="q">Search devotionals</label>
        <input id="q" className="search" type="search" placeholder="Search by title or scripture" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {error && (
        <div className="empty"><h2>Past days could not load</h2><p>Check your connection, then try again.</p>
          <button className="btn" onClick={load}>Try again</button></div>
      )}
      {!items && !error && <div className="loading"><div className="shimmer" /><div className="shimmer" /><div className="shimmer" /></div>}
      {items && groups.length === 0 && (
        <div className="empty"><h2>{q ? "Nothing matches that search" : "No devotionals yet"}</h2>
          <p>{q ? "Try a different word or a book of the Bible." : "Past devotionals will appear here."}</p></div>
      )}

      {groups.map(([k, list]) => {
        const [y, m] = k.split("-").map(Number);
        return (
          <section className="month" key={k}>
            <h2>{MONTHS[m - 1]} {y}</h2>
            <ol>
              {list.map((e) => (
                <li key={e.date}>
                  <Link className="entry" to={e.date === today ? "/" : `/day/${e.date}`}>
                    <span className="e-day">{fromIso(e.date).getDate()}<span className="e-wd">{fmtShortWeekday(e.date)}</span></span>
                    <span>
                      <span className="e-title">{e.title || "Devotional"}</span>
                      {e.reference && <span className="e-ref">{e.reference}</span>}
                    </span>
                    {e.date > today ? <span className="tag">Scheduled</span> : e.date === today ? <span className="tag">Today</span> : <span />}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </section>
  );
}
