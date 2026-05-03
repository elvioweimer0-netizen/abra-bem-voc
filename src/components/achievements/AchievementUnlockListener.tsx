import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

const STORAGE_KEY = "seen_unlocked_achievements_v1";

function getSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}
function markSeen(id: string) {
  const s = getSeen();
  s.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
}

export function AchievementUnlockListener() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const announced = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    // Show recent unlocks user hasn't seen yet
    (async () => {
      const { data } = await supabase
        .from("user_achievements" as any)
        .select("id, unlocked_at, achievement:achievements(name, description, icon)")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("unlocked_at", { ascending: false })
        .limit(5);
      const seen = getSeen();
      for (const row of (data ?? []) as any[]) {
        if (!seen.has(row.id)) showUnlock(row);
        markSeen(row.id);
      }
    })();

    const channel = supabase
      .channel(`user_achievements_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_achievements", filter: `user_id=eq.${user.id}` },
        async (payload: any) => {
          const row = payload.new;
          if (!row?.completed || !row?.id) return;
          if (announced.current.has(row.id)) return;
          announced.current.add(row.id);
          const { data } = await supabase
            .from("achievements" as any)
            .select("name, description, icon")
            .eq("id", row.achievement_id)
            .maybeSingle();
          showUnlock({ id: row.id, achievement: data });
          markSeen(row.id);
          qc.invalidateQueries({ queryKey: ["user_achievements"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  return null;
}

function showUnlock(row: { id: string; achievement: any }) {
  const a = row.achievement;
  if (!a) return;
  toast.success(`🏆 ${a.name}`, {
    description: a.description,
    duration: 8000,
    action: {
      label: "Ver",
      onClick: () => (window.location.href = "/perfil/conquistas"),
    },
  });
}

export default AchievementUnlockListener;
