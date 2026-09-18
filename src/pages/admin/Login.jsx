import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import { useAuth } from "../../lib/auth.jsx";
import Logo from "../../components/Logo.jsx";

export default function Login() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!loading && session) return <Navigate to={location.state?.from || "/admin"} replace />;

  async function signIn(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setMsg({ type: "err", text: /invalid/i.test(error.message) ? "That email and password do not match an admin account." : error.message });
  }

  async function forgot() {
    if (!email.trim()) { setMsg({ type: "err", text: "Enter your email first, then choose Forgot password." }); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/admin/reset` });
    setBusy(false);
    setMsg(error ? { type: "err", text: error.message } : { type: "ok", text: `A reset link has been sent to ${email.trim()}.` });
  }

  return (
    <main className="auth">
      <form className="auth-card" onSubmit={signIn}>
        <div className="auth-brand"><Logo size={40} /><span className="brand-name">Chrio Life</span></div>
        <h1>Admin sign in</h1>
        <label className="field">Email
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">Password
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {msg && <p className={`status ${msg.type}`}>{msg.text}</p>}
        <button className="btn primary wide" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <div className="auth-links">
          <button type="button" className="linkbtn" onClick={forgot} disabled={busy}>Forgot password</button>
          <Link to="/">Back to the devotional</Link>
        </div>
      </form>
    </main>
  );
}
