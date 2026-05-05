import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFraseDoDia() {
  const [frase, setFrase] = useState<{ frase: string; autor?: string | null } | null>(null);
  useEffect(() => {
    (async () => {
      const today = new Date();
      const { data } = await (supabase as any)
        .from("frases_do_dia")
        .select("frase,autor,dia_semana")
        .eq("active", true);
      if (!data?.length) return;
      const dow = today.getDay();
      const todays = data.filter((d: any) => d.dia_semana == null || d.dia_semana === dow);
      const pool = todays.length ? todays : data;
      const idx = Math.floor((today.getFullYear() * 1000 + today.getMonth() * 50 + today.getDate()) % pool.length);
      setFrase({ frase: pool[idx].frase, autor: pool[idx].autor });
    })();
  }, []);
  return frase;
}
