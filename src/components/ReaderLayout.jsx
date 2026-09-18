import { Link, NavLink, Outlet } from "react-router-dom";
import Logo from "./Logo.jsx";
import { useInstallPrompt, useTextSize } from "../lib/hooks.js";
import { useAuth } from "../lib/auth.jsx";

export default function ReaderLayout() {
  const [size, setSize] = useTextSize();
  const [canInstall, install] = useInstallPrompt();
  const { isAdmin } = useAuth();

  return (
    <>
      <header className="bar">
        <div className="bar-inner">
          <Link to="/" className="brand" aria-label="Chrio Life Daily Devotional, today">
            <Logo />
            <span>
              <span className="brand-name">Chrio Life</span>
              <span className="brand-sub">Daily Devotional</span>
            </span>
          </Link>
          <nav className="tabs" aria-label="Sections">
            <NavLink to="/" end className="tab">Today</NavLink>
            <NavLink to="/archive" className="tab">Past days</NavLink>
            {isAdmin && <NavLink to="/admin" className="tab">Dashboard</NavLink>}
          </nav>
          <div className="bar-tools">
            {canInstall && <button className="install" onClick={install}>Install app</button>}
            <div className="sizer" role="group" aria-label="Text size">
              {[["sm", ".85rem", "Smaller text"], ["md", "1.05rem", "Normal text"], ["lg", "1.3rem", "Larger text"]].map(([k, fs, label]) => (
                <button key={k} style={{ fontSize: fs }} aria-label={label} aria-pressed={size === k} onClick={() => setSize(k)}>A</button>
              ))}
            </div>
          </div>
        </div>
      </header>
      <main className="reader">
        <Outlet />
      </main>
      <footer className="foot">Chrio Life Daily Devotional</footer>
    </>
  );
}
