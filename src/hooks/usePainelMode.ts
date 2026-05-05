import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPersona } from "@/hooks/useUserPersona";

export type PainelMode = "simples" | "completo";
const KEY = "painel_mode";

export function usePainelMode() {
  const { profile, user } = useAuth();
  const persona = useUserPersona();
  const dbMode = ((profile as any)?.painel_mode as PainelMode) || null;
  const initial: PainelMode =
    (typeof window !== "undefined" && (localStorage.getItem(KEY) as PainelMode)) ||
    dbMode ||
    (persona === "gerente_novo" || persona === "encarregado_novato" ? "simples" : "completo");
  const [mode, setModeState] = useState<PainelMode>(initial);

  useEffect(() => {
    if (dbMode && dbMode !== mode && !localStorage.getItem(KEY)) setModeState(dbMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbMode]);

  const setMode = useCallback(
    async (m: PainelMode) => {
      setModeState(m);
      try { localStorage.setItem(KEY, m); } catch {}
      if (user) await (supabase as any).from("profiles").update({ painel_mode: m }).eq("user_id", user.id);
    },
    [user],
  );

  return { mode, setMode };
}
