import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase.js";

const AuthContext = createContext({ session: null, isAdmin: false, loading: true });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const check = async (s) => {
      setSession(s);
      if (!s) { setIsAdmin(false); setLoading(false); return; }
      const { data } = await supabase.rpc("is_admin");
      if (active) { setIsAdmin(Boolean(data)); setLoading(false); }
    };
    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => { check(s); });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return <AuthContext.Provider value={{ session, isAdmin, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
