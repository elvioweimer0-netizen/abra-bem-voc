import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UpcomingMilestone {
  id: string;
  user_id: string;
  milestone_type: string;
  milestone_date: string;
  post_visible: boolean;
  profile?: { nome: string; foto_url: string | null; unit_id: string | null } | null;
}

export function useUpcomingMilestones(daysAhead = 7) {
  return useQuery({
    queryKey: ["upcoming-milestones", daysAhead],
    queryFn: async (): Promise<UpcomingMilestone[]> => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const future = new Date(today);
      future.setDate(future.getDate() + daysAhead);

      const { data, error } = await supabase
        .from("milestone_celebrations")
        .select("id, user_id, milestone_type, milestone_date, post_visible")
        .eq("post_visible", true)
        .gte("milestone_date", yesterday.toISOString().slice(0, 10))
        .lte("milestone_date", future.toISOString().slice(0, 10))
        .order("milestone_date", { ascending: true });
      if (error) throw error;

      const userIds = [...new Set((data ?? []).map((m) => m.user_id))];
      if (!userIds.length) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nome, foto_url, unit_id")
        .in("user_id", userIds);
      const map = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return (data ?? []).map((m) => ({ ...m, profile: map.get(m.user_id) ?? null }));
    },
  });
}

export function milestoneYears(type: string): number | null {
  const m = type.match(/^(\d+)_year/);
  return m ? Number(m[1]) : null;
}

export function milestoneLabel(type: string): string {
  const y = milestoneYears(type);
  if (y) return `${y} ${y === 1 ? "ano" : "anos"} no Curió`;
  if (type === "first_day") return "Primeiro dia";
  if (type === "promotion") return "Promoção";
  return type;
}
