import { useEffect, useState } from "react";
import { todayIso } from "./dates.js";

/** Keeps "today" correct if the app stays open past midnight. */
export function useToday() {
  const [today, setToday] = useState(todayIso());
  useEffect(() => {
    const tick = () => setToday(todayIso());
    const id = setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, []);
  return today;
}

export function useTextSize() {
  const [size, setSize] = useState(() => {
    try { return localStorage.getItem("chrio-size") || "md"; } catch { return "md"; }
  });
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("size-sm", "size-lg");
    if (size !== "md") root.classList.add(`size-${size}`);
    try { localStorage.setItem("chrio-size", size); } catch { /* private mode */ }
  }, [size]);
  return [size, setSize];
}

/** Captures the browser's "install app" prompt so the header can offer it. */
export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setPromptEvent(e); };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  const install = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice.catch(() => {});
    setPromptEvent(null);
  };
  return [Boolean(promptEvent), install];
}
