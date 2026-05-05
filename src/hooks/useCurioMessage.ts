import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCurioMessage(context: string, role?: string) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("curio_messages")
        .select("message,priority,role_target")
        .eq("active", true)
        .eq("context", context)
        .order("priority", { ascending: false })
        .limit(20);
      if (!alive || !data?.length) return;
      const filtered = role
        ? data.filter((m: any) => !m.role_target || m.role_target.length === 0 || m.role_target.includes(role))
        : data;
      const pool = filtered.length ? filtered : data;
      const pick = pool[Math.floor(Math.random() * Math.min(pool.length, 5))];
      setMessage(pick?.message ?? null);
    })();
    return () => { alive = false; };
  }, [context, role]);

  return message;
}
