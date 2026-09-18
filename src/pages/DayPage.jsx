import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDevotional, getNeighbours } from "../lib/api.js";
import { fmtFull, fmtWeekday, isValidIso, paragraphs } from "../lib/dates.js";
import { useToday } from "../lib/hooks.js";
import { useAuth } from "../lib/auth.jsx";
import { useToast } from "../components/Toast.jsx";

export default function DayPage() {
  const params = useParams();
  const today = useToday();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const date = isValidIso(params.date) ? params.date : today;
  const [state, setState] = useState({ status: "loading", devo: null, prev: null, next: null });
  const [reload, setReload] = useState(0);
  const [toastNode, toast] = useToast();

  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, status: "loading" }));
    Promise.all([getDevotional(date), getNeighbours(date)])
      .then(([devo, n]) => live && setState({ status: "ready", devo, prev: n.prev, next: n.next }))
      .catch(() => live && setState({ status: "error", devo: null, prev: null, next: null }));
    window.scrollTo({ top: 0 });
    return () => { live = false; };
  }, [date, reload]);

  const go = (d) => navigate(d === today ? "/" : `/day/${d}`);
  const isFuture = date > today;
  const { status, devo, prev, next } = state;

  async function share() {
    const text = buildText(devo, date);
    if (navigator.share) {
      try { await navigator.share({ title: devo.title || "Chrio Life Daily Devotional", text, url: `${location.origin}/day/${date}` }); return; }
      catch (e) { if (e?.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(text); toast("Devotional copied"); }
    catch { toast("Select the text to copy it"); }
  }

  return (
    <section>
      <div className="daynav">
        <button className="stepbtn" disabled={!prev} onClick={() => go(prev)} aria-label="Previous devotional">‹ <span className="lbl">Previous</span></button>
        <div className="datepick">
          <label htmlFor="dateInput">
            <span className="weekday">{date === today ? `Today, ${fmtWeekday(date)}` : fmtWeekday(date)}</span>
            <span className="fulldate">{fmtFull(date)}</span>
          </label>
          <input id="dateInput" type="date" value={date} max={isAdmin ? undefined : today}
            onChange={(e) => isValidIso(e.target.value) && go(e.target.value)} aria-label="Choose a date" />
          {date !== today && <Link className="todaylink" to="/">Back to today</Link>}
        </div>
        <button className="stepbtn" disabled={!next} onClick={() => go(next)} aria-label="Next devotional"><span className="lbl">Next</span> ›</button>
      </div>

      {status === "loading" && <Skeleton />}

      {status === "error" && (
        <div className="empty">
          <h2>This devotional could not load</h2>
          <p>Check your connection, then try again.</p>
          <button className="btn" onClick={() => setReload((n) => n + 1)}>Try again</button>
        </div>
      )}

      {status === "ready" && !devo && (
        <div className="empty reveal">
          <h2>{isFuture ? "This day is not open yet" : date === today ? "Today's devotional is on its way" : "No devotional for this day"}</h2>
          <p>{isFuture ? `Come back on ${fmtFull(date)}.` : "You can read an earlier devotional while you wait."}</p>
          <div className="actions center">
            {prev && <button className="btn" onClick={() => go(prev)}>Read {fmtFull(prev)}</button>}
            <Link className="btn" to="/archive">Browse past days</Link>
          </div>
        </div>
      )}

      {status === "ready" && devo && (
        <article className="devo reveal" key={date}>
          {devo.title && <h1 className="devo-title">{devo.title}</h1>}
          {(devo.scripture || devo.reference) && (
            <blockquote className="verse">
              {devo.scripture && <p>{devo.scripture}</p>}
              {devo.reference && <cite>{devo.reference}</cite>}
            </blockquote>
          )}
          <div className="message">{paragraphs(devo.message).map((p, i) => <p key={i}>{p}</p>)}</div>
          {devo.prayer && (
            <section className="block prayer"><h2>Prayer</h2>{paragraphs(devo.prayer).map((p, i) => <p key={i}>{p}</p>)}</section>
          )}
          {devo.declaration && (
            <section className="block"><h2>Declaration</h2>{paragraphs(devo.declaration).map((p, i) => <p key={i}>{p}</p>)}</section>
          )}
          {(devo.further_reading || devo.author) && (
            <div className="meta">
              {devo.further_reading && <div><strong>Further reading: </strong>{devo.further_reading}</div>}
              {devo.author && <div><strong>Written by </strong>{devo.author}</div>}
            </div>
          )}
          <div className="actions">
            {isFuture && <span className="tag">Scheduled — readers see this on {fmtFull(date)}</span>}
            <button className="btn" onClick={share}>Share devotional</button>
            {isAdmin && <Link className="btn" to={`/admin/entries/${date}`}>Edit</Link>}
          </div>
        </article>
      )}
      {toastNode}
    </section>
  );
}

function Skeleton() {
  return (
    <div className="loading" aria-label="Loading">
      <div className="shimmer h" /><div className="shimmer" /><div className="shimmer" />
      <div className="shimmer" style={{ width: "85%" }} /><div className="shimmer" style={{ width: "60%" }} />
    </div>
  );
}

function buildText(d, date) {
  const out = ["CHRIO LIFE DAILY DEVOTIONAL", `${fmtWeekday(date)}, ${fmtFull(date)}`, "", d.title || ""];
  if (d.scripture || d.reference) out.push("", `${d.scripture ? `“${d.scripture}”` : ""}${d.reference ? ` — ${d.reference}` : ""}`);
  if (d.message) out.push("", paragraphs(d.message).join("\n\n"));
  if (d.prayer) out.push("", "PRAYER", paragraphs(d.prayer).join("\n"));
  if (d.declaration) out.push("", "DECLARATION", paragraphs(d.declaration).join("\n"));
  if (d.further_reading) out.push("", `Further reading: ${d.further_reading}`);
  return out.join("\n").trim();
}
