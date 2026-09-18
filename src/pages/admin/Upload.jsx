import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { prepareRows, readCsvFile, toCsv, TEMPLATE_ROWS, downloadText } from "../../lib/csv.js";
import { existingDates, friendlyError, upsertMany } from "../../lib/api.js";
import { fmtFull } from "../../lib/dates.js";

export default function Upload() {
  const [raw, setRaw] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fmt, setFmt] = useState("dmy");
  const [result, setResult] = useState(null);
  const [overlap, setOverlap] = useState(0);
  const [over, setOver] = useState(false);
  const [pub, setPub] = useState({ state: "idle", done: 0, total: 0, msg: "" });
  const input = useRef();

  async function analyse(data, f) {
    const r = prepareRows(data, f);
    setResult(r);
    setPub({ state: "idle", done: 0, total: 0, msg: "" });
    setOverlap(0);
    if (r.items?.length) {
      try { const ex = await existingDates(r.items.map((i) => i.date)); setOverlap(ex.size); } catch { /* preview still works */ }
    }
  }

  async function onFile(file) {
    if (!file) return;
    setFileName(file.name);
    try {
      const data = await readCsvFile(file);
      setRaw(data);
      analyse(data, fmt);
    } catch (e) {
      setResult({ fatal: `This file could not be read: ${e.message}` });
    }
  }

  async function publish() {
    const items = result.items;
    setPub({ state: "working", done: 0, total: items.length, msg: "" });
    try {
      await upsertMany(items, (done, total) => setPub({ state: "working", done, total, msg: "" }));
      setPub({ state: "done", done: items.length, total: items.length, msg: `Published ${items.length} devotionals.` });
    } catch (e) {
      setPub((p) => ({ ...p, state: "error", msg: `${friendlyError(e)} ${p.done ? `${p.done} were saved before it stopped; upload the same file again to finish.` : ""}` }));
    }
  }

  const items = result?.items || [];
  const pct = pub.total ? Math.round((pub.done / pub.total) * 100) : 0;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Upload CSV</h1>
          <p>One row per day. A row for a date that already exists replaces that day.</p>
        </div>
      </div>

      <div className="panel">
        <h2>1. Prepare your file</h2>
        <p>The first row must hold column names. Names are matched loosely, so "Bible Reference" or "Memory Verse" also work.</p>
        <ul className="cols">
          <li><code>date</code> <span className="req">required</span></li>
          <li><code>message</code> <span className="req">required</span></li>
          <li><code>title</code></li>
          <li><code>scripture</code> — verse text</li>
          <li><code>reference</code> — e.g. John 15:5</li>
          <li><code>prayer</code></li>
          <li><code>declaration</code></li>
          <li><code>further_reading</code></li>
          <li><code>author</code></li>
        </ul>
        <p className="small">Dates can be written as 2026-09-18, 18/09/2026 or 18 September 2026. For a new paragraph inside a cell, press Alt+Enter in Excel or Ctrl+Enter in Google Sheets. Save the sheet as CSV (UTF-8).</p>
        <button className="btn" onClick={() => downloadText("chrio-life-template.csv", toCsv(TEMPLATE_ROWS))}>Download CSV template</button>
      </div>

      <div className="panel">
        <h2>2. Choose the file</h2>
        <label className={`drop${over ? " over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files[0]); }}>
          <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => onFile(e.target.files[0])} />
          <strong>{fileName || "Choose a CSV file"}</strong><br />{fileName ? "Choose a different file" : "or drag it here"}
        </label>
        <label className="field narrow">How are dates with slashes written?
          <select value={fmt} onChange={(e) => { setFmt(e.target.value); if (raw) analyse(raw, e.target.value); }}>
            <option value="dmy">Day first — 18/09/2026</option>
            <option value="mdy">Month first — 09/18/2026</option>
          </select>
        </label>

        {result?.fatal && <p className="status err">{result.fatal}</p>}

        {result && !result.fatal && (
          <>
            <div className="stats compact">
              <div className="stat"><b>{items.length}</b>days ready</div>
              {items.length > 0 && <div className="stat"><b>{fmtFull(items[0].date)}</b>first day</div>}
              {items.length > 0 && <div className="stat"><b>{fmtFull(items[items.length - 1].date)}</b>last day</div>}
              {overlap > 0 && <div className="stat"><b>{overlap}</b>will replace existing days</div>}
              {result.issues.length > 0 && <div className="stat warn"><b>{result.issues.length}</b>rows to check</div>}
            </div>
            {result.issues.length > 0 && (
              <ul className="issues">
                {result.issues.slice(0, 15).map((s, i) => <li key={i}>{s}</li>)}
                {result.issues.length > 15 && <li>…and {result.issues.length - 15} more</li>}
              </ul>
            )}
            {result.unmatched.length > 0 && <p className="small">These columns are not used: {result.unmatched.join(", ")}.</p>}
            {items.length > 0 && (
              <div className="tablewrap">
                <table>
                  <thead><tr><th>Date</th><th>Title</th><th>Reference</th><th>Message</th></tr></thead>
                  <tbody>
                    {items.slice(0, 6).map((it) => (
                      <tr key={it.date}><td className="nowrap">{fmtFull(it.date)}</td><td>{it.title || "—"}</td><td>{it.reference || "—"}</td><td className="clip" title={it.message}>{it.message}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {items.length > 6 && <p className="small">Showing the first 6 of {items.length} days.</p>}
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="panel">
          <h2>3. Publish</h2>
          <p>{items.length} devotionals from {fileName} will be saved. Readers see each one on its date.</p>
          <button className="btn primary" onClick={publish} disabled={pub.state === "working" || pub.state === "done"}>
            {pub.state === "working" ? "Publishing…" : pub.state === "done" ? "Published" : `Publish ${items.length} devotionals`}
          </button>
          {pub.state !== "idle" && <div className="progress"><span style={{ width: `${pct}%` }} /></div>}
          {pub.state === "working" && <p className="status">Saved {pub.done} of {pub.total}…</p>}
          {pub.state === "done" && <p className="status ok">{pub.msg} <Link to="/admin/entries">See all devotionals</Link></p>}
          {pub.state === "error" && <p className="status err">{pub.msg}</p>}
        </div>
      )}
    </>
  );
}
