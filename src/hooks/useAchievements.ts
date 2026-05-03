import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Achievement = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string | null;
  category: string;
  criteria_type: string;
  criteria_target: number | null;
  criteria_metric: string;
  role_filter: string[] | null;
  active: boolean;
  ordem: number;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  current_progress: number;
  completed: boolean;
  unlocked_at: string | null;
  achievement?: Achievement;
};

export function useAllAchievements() {
  return useQuery({
    queryKey: ["achievements", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements" as any)
        .select("*")
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Achievement[];
    },
  });
}

export function useUserAchievements(userId?: string) {
  const { user } = useAuth();
  const target = userId ?? user?.id;
  return useQuery({
    queryKey: ["user_achievements", target],
    enabled: !!target,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements" as any)
        .select("*, achievement:achievements(*)")
        .eq("user_id", target!);
      if (error) throw error;
      return (data ?? []) as unknown as UserAchievement[];
    },
  });
}

export function useMyAchievements() {
  const { user } = useAuth();
  const all = useAllAchievements();
  const mine = useUserAchievements(user?.id);
  const merged = (all.data ?? []).map((a) => {
    const ua = mine.data?.find((u) => u.achievement_id === a.id);
    return { achievement: a, progress: ua };
  });
  return { merged, isLoading: all.isLoading || mine.isLoading };
}

export function useRecentUnlocked(userId?: string, limit = 5) {
  const { user } = useAuth();
  const target = userId ?? user?.id;
  return useQuery({
    queryKey: ["user_achievements", "recent", target, limit],
    enabled: !!target,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements" as any)
        .select("*, achievement:achievements(*)")
        .eq("user_id", target!)
        .eq("completed", true)
        .order("unlocked_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as UserAchievement[];
    },
  });
}

export function useAchievementsRanking(unitId?: string) {
  return useQuery({
    queryKey: ["achievements", "ranking", unitId],
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("user_achievements" as any)
        .select("user_id")
        .eq("completed", true)
        .gte("unlocked_at", monthStart.toISOString());
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const r of (data ?? []) as any[]) {
        counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1);
      }
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      if (top.length === 0) return [];
      const userIds = top.map((t) => t[0]);
      let q = supabase.from("profiles").select("user_id, nome, foto_url, unit_id, unidade").in("user_id", userIds);
      if (unitId) q = q.eq("unit_id", unitId);
      const { data: profiles } = await q;
      return top
        .map(([uid, count]) => ({
          user_id: uid,
          count,
          profile: (profiles ?? []).find((p: any) => p.user_id === uid),
        }))
        .filter((r) => !unitId || r.profile);
    },
  });
}

export function useUpsertAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Achievement> & { id?: string }) => {
      if (payload.id) {
        const { error } = await supabase.from("achievements" as any).update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("achievements" as any).insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["achievements"] }),
  });
}

export function useToggleAchievementActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("achievements" as any).update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["achievements"] }),
  });
}
