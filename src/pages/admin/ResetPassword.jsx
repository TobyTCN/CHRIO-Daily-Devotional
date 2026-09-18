import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import { useAuth } from "../../lib/auth.jsx";

export default function ResetPassword() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    if (pw.length < 8) { setMsg({ type: "err", text: "Use at least 8 characters." }); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setMsg({ type: "err", text: error.message });
    else navigate("/admin", { replace: true });
  }

  return (
    <main className="auth">
      <form className="auth-card" onSubmit={save}>
        <h1>Set a new password</h1>
        {loading ? <p>Checking your reset link…</p> : !session ? (
          <p>This reset link has expired. Go back to sign in and choose Forgot password again.</p>
        ) : (
          <>
            <label className="field">New password
              <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            </label>
            {msg && <p className={`status ${msg.type}`}>{msg.text}</p>}
            <button className="btn primary wide" disabled={busy}>{busy ? "Saving…" : "Save password"}</button>
          </>
        )}
      </form>
    </main>
  );
}
