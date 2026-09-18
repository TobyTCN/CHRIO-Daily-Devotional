import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteDevotional, friendlyError, listIndex } from "../../lib/api.js";
import { fmtFull, todayIso } from "../../lib/dates.js";

const PAGE = 50;

export default function Entries() {
  const today = todayIso();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);

  const load = () => listIndex().then(setItems).catch((e) => setError(friendlyError(e)));
  useEffect(() => { load(); }, []);
  useEffect(() => setPage(0), [q, filter]);

  const shown = useMemo(() => {
    if (!items) return [];
    const term = q.trim().toLowerCase();
    return items.filter((i) =>
      (filter === "all" || (filter === "live" ? i.date <= today : i.date > today)) &&
      (!term || `${i.title} ${i.reference} ${i.date}`.toLowerCase().includes(term)));
  }, [items, q, filter, today]);

  async function remove(date) {
    if (!confirm(`Delete the devotional for ${fmtFull(date)}? This cannot be undone.`)) return;
    try { await deleteDevotional(date); setItems((l) => l.filter((i) => i.date !== date)); }
    catch (e) { setError(friendlyError(e)); }
  }

  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const slice = shown.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Devotionals</h1>
          <p>{items ? `${items.length} in total` : "Loading…"}</p>
        </div>
        <div className="actions"><Link className="btn primary" to="/admin/entries/new">Add one devotional</Link></div>
      </div>

      <div className="toolbar">
        <input className="search" type="search" placeholder="Search by title, scripture or date" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search devotionals" />
        <div className="seg" role="group" aria-label="Filter">
          {[["all", "All"], ["live", "Published"], ["scheduled", "Scheduled"]].map(([k, l]) => (
            <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>

      {error && <p className="status err">{error}</p>}

      {items && (
        <div className="tablewrap">
          <table>
            <thead><tr><th>Date</th><th>Title</th><th>Reference</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {slice.length === 0 && <tr><td colSpan="5" className="muted">No devotionals match.</td></tr>}
              {slice.map((i) => (
                <tr key={i.date}>
                  <td className="nowrap">{fmtFull(i.date)}</td>
                  <td>{i.title || <span className="muted">Untitled</span>}</td>
                  <td>{i.reference}</td>
                  <td>{i.date > today ? <span className="tag">Scheduled</span> : i.date === today ? <span className="tag live">Today</span> : <span className="muted">Published</span>}</td>
                  <td className="nowrap rowacts">
                    <Link to={`/admin/entries/${i.date}`}>Edit</Link>
                    <Link to={i.date === today ? "/" : `/day/${i.date}`}>View</Link>
                    <button className="linkbtn danger" onClick={() => remove(i.date)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="pager">
          <button className="btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Newer</button>
          <span>Page {page + 1} of {pages}</span>
          <button className="btn" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Older</button>
        </div>
      )}
    </>
  );
}
