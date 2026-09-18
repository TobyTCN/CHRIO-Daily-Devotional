import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { deleteDevotional, friendlyError, getDevotional, saveDevotional } from "../../lib/api.js";
import { fmtFull, isValidIso, todayIso } from "../../lib/dates.js";

const EMPTY = { date: "", title: "", scripture: "", reference: "", message: "", prayer: "", declaration: "", further_reading: "", author: "" };

export default function EditEntry() {
  const { date: original } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const isNew = !original;
  const [form, setForm] = useState({ ...EMPTY, date: search.get("date") || todayIso() });
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (isNew) return;
    getDevotional(original).then((d) => {
      if (d) setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, d[k] ?? ""])));
      else setMsg({ type: "err", text: `There is no devotional for ${fmtFull(original)}.` });
      setLoading(false);
    }).catch((e) => { setMsg({ type: "err", text: friendlyError(e) }); setLoading(false); });
  }, [original, isNew]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    if (!isValidIso(form.date)) { setMsg({ type: "err", text: "Choose a date." }); return; }
    if (!form.message.trim()) { setMsg({ type: "err", text: "The message cannot be empty." }); return; }
    if (form.date !== original) {
      const clash = await getDevotional(form.date).catch(() => null);
      if (clash && !confirm(`${fmtFull(form.date)} already has a devotional ("${clash.title || "Untitled"}"). Replace it?`)) return;
    }
    setBusy(true); setMsg(null);
    try {
      const item = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, String(v).trim()]));
      await saveDevotional(item, original);
      setMsg({ type: "ok", text: `Saved ${fmtFull(item.date)}.` });
      if (isNew || item.date !== original) navigate(`/admin/entries/${item.date}`, { replace: true });
    } catch (err) { setMsg({ type: "err", text: friendlyError(err) }); }
    setBusy(false);
  }

  async function remove() {
    if (!confirm(`Delete the devotional for ${fmtFull(original)}? This cannot be undone.`)) return;
    try { await deleteDevotional(original); navigate("/admin/entries", { replace: true }); }
    catch (err) { setMsg({ type: "err", text: friendlyError(err) }); }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>{isNew ? "Add a devotional" : "Edit devotional"}</h1>
          <p>{isNew ? "Fill in the day's devotional. Only the date and message are required." : fmtFull(original)}</p>
        </div>
        {!isNew && <div className="actions"><Link className="btn" to={original === todayIso() ? "/" : `/day/${original}`}>View as reader</Link></div>}
      </div>

      <form className="panel form" onSubmit={save}>
        <div className="grid2">
          <label className="field">Date<input type="date" required value={form.date} onChange={set("date")} /></label>
          <label className="field">Title<input value={form.title} onChange={set("title")} placeholder="e.g. Abiding in the Vine" /></label>
        </div>
        <div className="grid2">
          <label className="field">Scripture reference<input value={form.reference} onChange={set("reference")} placeholder="e.g. John 15:5" /></label>
          <label className="field">Author<input value={form.author} onChange={set("author")} /></label>
        </div>
        <label className="field">Scripture text<textarea rows="3" value={form.scripture} onChange={set("scripture")} /></label>
        <label className="field">Message <span className="req">required</span><textarea rows="12" value={form.message} onChange={set("message")} placeholder="Leave a blank line between paragraphs." /></label>
        <label className="field">Prayer<textarea rows="4" value={form.prayer} onChange={set("prayer")} /></label>
        <label className="field">Declaration<textarea rows="3" value={form.declaration} onChange={set("declaration")} /></label>
        <label className="field">Further reading<input value={form.further_reading} onChange={set("further_reading")} placeholder="e.g. John 15:1-17" /></label>
        {msg && <p className={`status ${msg.type}`}>{msg.text}</p>}
        <div className="actions">
          <button className="btn primary" disabled={busy}>{busy ? "Saving…" : isNew ? "Save devotional" : "Save changes"}</button>
          <Link className="btn" to="/admin/entries">Back to list</Link>
          {!isNew && <button type="button" className="btn danger" onClick={remove}>Delete</button>}
        </div>
      </form>
    </>
  );
}
