import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function mondayOf(d: Date): string {
  const dt = new Date(d);
  const day = dt.getDay(); // 0=sun
  const diff = (day === 0 ? -6 : 1 - day);
  dt.setDate(dt.getDate() + diff);
  return dt.toISOString().slice(0, 10);
}

export function usePulseWeekly() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState<{ id: string; question_text: string } | null>(null);

  useEffect(() => {
    if (!profile?.user_id) return;
    const today = new Date();
    if (today.getDay() !== 5) return; // só sexta
    const wk = mondayOf(today);
    const dismissedKey = `pulse_dismissed_${wk}`;
    if (localStorage.getItem(dismissedKey)) return;

    let cancelled = false;
    (async () => {
      const { data: q } = await supabase
        .from("pulse_questions")
        .select("id, question_text")
        .eq("week_start_date", wk)
        .eq("active", true)
        .maybeSingle();
      if (cancelled || !q) return;
      const { count } = await supabase
        .from("pulse_answers")
        .select("id", { count: "exact", head: true })
        .eq("question_id", (q as any).id)
        .eq("user_id", profile.user_id);
      if (!cancelled && (count ?? 0) === 0) {
        setQuestion(q as any);
        setOpen(true);
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.user_id]);

  const dismiss = (persist = false) => {
    if (persist) {
      const wk = mondayOf(new Date());
      localStorage.setItem(`pulse_dismissed_${wk}`, "1");
    }
    setOpen(false);
  };

  return { open, dismiss, question };
}
