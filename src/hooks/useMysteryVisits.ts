import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MysteryVisit = {
  id: string;
  visitor_user_id: string;
  target_unit_id: string;
  visit_date: string;
  visit_time: string | null;
  anonymous_to_team: boolean;
  overall_score: number | null;
  notes: string | null;
  photos: string[];
  created_at: string;
  visitor?: { nome: string | null; cargo_titulo: string | null } | null;
  unit?: { code: string | null; name: string | null } | null;
};

export type MysteryVisitFilters = {
  unitId?: string | null;
  visitorId?: string | null;
  from?: string | null;
  to?: string | null;
  mineOnly?: boolean;
};

export function useMysteryVisits(filters: MysteryVisitFilters = {}) {
  return useQuery({
    queryKey: ["mystery_visits", filters],
    queryFn: async () => {
      let q = (supabase as any)
        .from("mystery_visits")
        .select(`
          id, visitor_user_id, target_unit_id, visit_date, visit_time,
          anonymous_to_team, overall_score, notes, photos, created_at,
          visitor:profiles!mystery_visits_visitor_user_id_fkey(nome, cargo_titulo),
          unit:units!mystery_visits_target_unit_id_fkey(code, name)
        `)
        .order("visit_date", { ascending: false })
        .limit(200);

      if (filters.unitId) q = q.eq("target_unit_id", filters.unitId);
      if (filters.visitorId) q = q.eq("visitor_user_id", filters.visitorId);
      if (filters.from) q = q.gte("visit_date", filters.from);
      if (filters.to) q = q.lte("visit_date", filters.to);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as MysteryVisit[];
    },
  });
}

export type MysteryVisitScore = {
  id: string;
  visit_id: string;
  criteria_id: string;
  score: number;
  comment: string | null;
  criterion?: { code: string; name: string } | null;
};

export function useMysteryVisitScores(visitId: string | null) {
  return useQuery({
    queryKey: ["mystery_visit_scores", visitId],
    enabled: !!visitId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("mystery_visit_scores")
        .select(`
          id, visit_id, criteria_id, score, comment,
          criterion:mystery_visit_criteria!mystery_visit_scores_criteria_id_fkey(code, name)
        `)
        .eq("visit_id", visitId);
      if (error) throw error;
      return (data ?? []) as MysteryVisitScore[];
    },
  });
}
