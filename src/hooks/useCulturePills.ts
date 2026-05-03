import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type CultureValue = {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  ordem: number;
  active: boolean;
};

export type CulturePill = {
  id: string;
  title: string;
  content: string;
  value_id: string;
  image_url: string | null;
  link_url: string | null;
  display_date: string;
  active: boolean;
  created_by: string | null;
  created_at: string;
  value?: CultureValue;
  likes_count?: number;
  liked_by_me?: boolean;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

async function enrichLikes(pills: any[], userId?: string): Promise<CulturePill[]> {
  if (!pills.length) return [];
  const ids = pills.map((p) => p.id);
  const { data: likes } = await supabase
    .from("culture_pill_likes")
    .select("pill_id, user_id")
    .in("pill_id", ids);
  const counts = new Map<string, number>();
  const mine = new Set<string>();
  (likes ?? []).forEach((l: any) => {
    counts.set(l.pill_id, (counts.get(l.pill_id) ?? 0) + 1);
    if (userId && l.user_id === userId) mine.add(l.pill_id);
  });
  return pills.map((p) => ({
    ...p,
    likes_count: counts.get(p.id) ?? 0,
    liked_by_me: mine.has(p.id),
  }));
}

export function useCultureValues() {
  return useQuery({
    queryKey: ["culture_values"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culture_values")
        .select("*")
        .eq("active", true)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as CultureValue[];
    },
  });
}

export function useTodayPill() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["culture_pill_today", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culture_pills")
        .select("*, value:culture_values(*)")
        .eq("active", true)
        .eq("display_date", todayISO())
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const enriched = await enrichLikes([data], user?.id);
      return enriched[0];
    },
  });
}

export function useCulturePillsList(valueCode?: string, page = 0, pageSize = 12) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["culture_pills_list", valueCode ?? "all", page, user?.id],
    queryFn: async () => {
      let q = supabase
        .from("culture_pills")
        .select("*, value:culture_values!inner(*)", { count: "exact" })
        .eq("active", true)
        .lte("display_date", todayISO())
        .order("display_date", { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);
      if (valueCode) q = q.eq("value.code", valueCode);
      const { data, error, count } = await q;
      if (error) throw error;
      const enriched = await enrichLikes(data ?? [], user?.id);
      return { pills: enriched, total: count ?? 0 };
    },
  });
}

export function useScheduledPills(monthStart: Date) {
  const start = monthStart.toISOString().slice(0, 10);
  const end = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
  return useQuery({
    queryKey: ["culture_pills_month", start],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culture_pills")
        .select("*, value:culture_values(*)")
        .gte("display_date", start)
        .lte("display_date", end)
        .order("display_date");
      if (error) throw error;
      return (data ?? []) as CulturePill[];
    },
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ pillId, liked }: { pillId: string; liked: boolean }) => {
      if (!user) throw new Error("Não autenticado");
      if (liked) {
        await supabase.from("culture_pill_likes").delete().eq("pill_id", pillId).eq("user_id", user.id);
      } else {
        await supabase.from("culture_pill_likes").insert({ pill_id: pillId, user_id: user.id });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["culture_pill_today"] });
      qc.invalidateQueries({ queryKey: ["culture_pills_list"] });
    },
  });
}

export function useCulturePillUpsert() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<CulturePill> & { id?: string }) => {
      if (input.id) {
        const { id, value, likes_count, liked_by_me, created_at, created_by, ...rest } = input;
        const { error } = await supabase.from("culture_pills").update(rest).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { error, data } = await supabase
        .from("culture_pills")
        .insert({
          title: input.title!,
          content: input.content!,
          value_id: input.value_id!,
          image_url: input.image_url ?? null,
          link_url: input.link_url ?? null,
          display_date: input.display_date!,
          active: input.active ?? true,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["culture_pill_today"] });
      qc.invalidateQueries({ queryKey: ["culture_pills_list"] });
      qc.invalidateQueries({ queryKey: ["culture_pills_month"] });
    },
  });
}
