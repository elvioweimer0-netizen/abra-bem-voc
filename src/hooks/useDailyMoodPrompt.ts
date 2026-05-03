import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const todayKey = () => new Date().toISOString().slice(0, 10);

export function useDailyMoodPrompt() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!profile?.user_id) return;
    const day = todayKey();
    const dismissedKey = `mood_prompt_dismissed_${day}`;
    if (localStorage.getItem(dismissedKey)) return;

    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("daily_mood")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.user_id)
        .gte("recorded_at", `${day}T00:00:00.000Z`)
        .lt("recorded_at", `${day}T23:59:59.999Z`);
      if (!cancelled && (count ?? 0) === 0) setOpen(true);
    })();
    return () => { cancelled = true; };
  }, [profile?.user_id]);

  const dismiss = (persist = false) => {
    if (persist) localStorage.setItem(`mood_prompt_dismissed_${todayKey()}`, "1");
    setOpen(false);
  };

  return { open, dismiss };
}
