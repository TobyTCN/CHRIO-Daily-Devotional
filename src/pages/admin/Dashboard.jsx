import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listAll, listIndex, friendlyError } from "../../lib/api.js";
import { addDays, fmtDayMonth, fmtFull, fmtWeekday, todayIso } from "../../lib/dates.js";
import { downloadText, toCsv } from "../../lib/csv.js";

export default function Dashboard() {
  const today = todayIso();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => { listIndex().then(setItems).catch((e) => setError(friendlyError(e))); }, []);

  const stats = useMemo(() => {
    if (!items) return null;
    const dates = new Set(items.map((i) => i.date));
    const live = items.filter((i) => i.date <= today).length;
    const scheduled = items.length - live;
    const last = items[0]?.date || null;
    const gaps = [];
    for (let i = 0; i < 30; i++) {
      const d = addDays(today, i);
      if (!dates.has(d)) gaps.push(d);
    }
    let runway = 0;
    while (dates.has(addDays(today, runway))) runway++;
    return { total: items.length, live, scheduled, last, gaps, runway, hasToday: dates.has(today) };
  }, [items, today]);

  async function exportAll() {
    setExporting(true);
    try {
      const all = await listAll();
      downloadText(`chrio-life-devotionals-backup-${today}.csv`, toCsv([...all].reverse()));
    } catch (e) { setError(friendlyError(e)); }
    setExporting(false);
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Overview</h1>
          <p>{fmtWeekday(today)}, {fmtFull(today)}</p>
        </div>
        <div className="actions">
          <Link className="btn primary" to="/admin/upload">Upload CSV</Link>
          <Link className="btn" to="/admin/entries/new">Add one devotional</Link>
          <button className="btn" onClick={exportAll} disabled={exporting}>{exporting ? "Preparing…" : "Download backup"}</button>
        </div>
      </div>

      {error && <p className="status err">{error}</p>}
      {!stats && !error && <p>Loading…</p>}

      {stats && (
        <>
          {!stats.hasToday && (
            <div className="alert">
              <strong>Today has no devotional.</strong> Readers are seeing an empty page.{" "}
              <Link to={`/admin/entries/new?date=${today}`}>Add today's devotional</Link>
            </div>
          )}
          <div className="stats">
            <div className="stat"><b>{stats.total}</b>devotionals in total</div>
            <div className="stat"><b>{stats.live}</b>visible to readers</div>
            <div className="stat"><b>{stats.scheduled}</b>scheduled ahead</div>
            <div className="stat"><b>{stats.runway}</b>{stats.runway === 1 ? "day" : "days"} covered from today</div>
          </div>

          <div className="panel">
            <h2>Next 30 days</h2>
            {stats.gaps.length === 0 ? (
              <p>Every day for the next 30 days has a devotional{stats.last ? `, and the schedule runs to ${fmtFull(stats.last)}` : ""}.</p>
            ) : (
              <>
                <p>{stats.gaps.length} {stats.gaps.length === 1 ? "day has" : "days have"} no devotional yet. Tap a date to add one.</p>
                <div className="chips">
                  {stats.gaps.map((d) => <Link key={d} className="chip" to={`/admin/entries/new?date=${d}`}>{fmtDayMonth(d)}</Link>)}
                </div>
              </>
            )}
          </div>

          <div className="panel">
            <h2>Recently published</h2>
            {items.length === 0 ? <p>Nothing yet. Upload your first CSV to get started.</p> : (
              <ul className="simple">
                {items.filter((i) => i.date <= today).slice(0, 5).map((i) => (
                  <li key={i.date}><Link to={`/admin/entries/${i.date}`}><span className="muted">{fmtDayMonth(i.date)}</span> {i.title || "Untitled"}</Link></li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  );
}
