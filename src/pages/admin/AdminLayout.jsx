import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth.jsx";
import { supabase } from "../../lib/supabase.js";
import Logo from "../../components/Logo.jsx";

export default function AdminLayout() {
  const { session, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="admin-wait">Checking your sign-in…</div>;
  if (!session) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) {
    return (
      <main className="auth">
        <div className="auth-card">
          <h1>No admin access</h1>
          <p>You are signed in as {session.user.email}, but this account is not an admin. Ask the owner to add it, following step 4 of the README.</p>
          <button className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </main>
    );
  }

  return (
    <div className="admin">
      <header className="bar">
        <div className="bar-inner">
          <Link to="/admin" className="brand">
            <Logo />
            <span><span className="brand-name">Chrio Life</span><span className="brand-sub">Admin dashboard</span></span>
          </Link>
          <nav className="tabs" aria-label="Admin sections">
            <NavLink to="/admin" end className="tab">Overview</NavLink>
            <NavLink to="/admin/upload" className="tab">Upload CSV</NavLink>
            <NavLink to="/admin/entries" className="tab">Devotionals</NavLink>
          </nav>
          <div className="bar-tools">
            <Link to="/" className="tab">View app</Link>
            <button className="tab" onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        </div>
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
