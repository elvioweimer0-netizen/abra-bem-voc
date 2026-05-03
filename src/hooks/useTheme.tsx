import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (next: ThemePreference) => Promise<void>;
  cycleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = "theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

function readInitial(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const saved = window.localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
  if (saved === "light" || saved === "dark" || saved === "system") return saved;
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [theme, setThemeState] = useState<ThemePreference>(readInitial);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Sync with profile preference once it loads
  useEffect(() => {
    const pref = (profile as any)?.theme_preference as ThemePreference | undefined;
    if (pref && pref !== theme) {
      setThemeState(pref);
      try { localStorage.setItem(STORAGE_KEY, pref); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Listen to system theme changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? "dark" : "light");
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  // Apply class
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback(async (next: ThemePreference) => {
    setThemeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    if (user?.id) {
      try {
        await (supabase as any).from("profiles").update({ theme_preference: next }).eq("user_id", user.id);
      } catch (err) {
        console.error("Erro ao salvar tema:", err);
      }
    }
  }, [user?.id]);

  const cycleTheme = useCallback(async () => {
    const order: ThemePreference[] = ["light", "dark", "system"];
    const idx = order.indexOf(theme);
    await setTheme(order[(idx + 1) % order.length]);
  }, [theme, setTheme]);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme, cycleTheme }), [theme, resolvedTheme, setTheme, cycleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
