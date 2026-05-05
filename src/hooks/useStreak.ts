import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function dateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function useStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = dateStr(new Date());
      await (supabase as any).from("painel_opens").insert({ user_id: user.id, opened_date: today }).then(() => {});
      const since = new Date();
      since.setDate(since.getDate() - 60);
      const { data } = await (supabase as any)
        .from("painel_opens")
        .select("opened_date")
        .eq("user_id", user.id)
        .gte("opened_date", dateStr(since))
        .order("opened_date", { ascending: false });
      if (!data) return;
      const set = new Set<string>(data.map((r: any) => r.opened_date));
      let count = 0;
      const cur = new Date();
      while (set.has(dateStr(cur))) {
        count++;
        cur.setDate(cur.getDate() - 1);
      }
      setStreak(count);
    })();
  }, [user]);

  return streak;
}
