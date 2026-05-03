import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DimensionBreakdownEntry = {
  raw: number;
  weight_original: number;
  weight_used: number;
  weighted: number;
  status: "ok" | "skipped";
};

export type ManagerScore = {
  id: string;
  user_id: string;
  year: number;
  month: number;
  unit_id: string | null;
  final_score: number;
  dimension_breakdown: Record<string, DimensionBreakdownEntry>;
  calculated_at: string;
};

export type ScoreDimension = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  weight: number;
  metric_query_name: string;
  active: boolean;
  ordem: number;
};

export function useScoreDimensions() {
  return useQuery({
    queryKey: ["score_dimensions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manager_score_dimensions")
        .select("*")
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as ScoreDimension[];
    },
  });
}

export function useUpdateDimension() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ScoreDimension> & { id: string }) => {
      const { error } = await supabase
        .from("manager_score_dimensions")
        .update({ weight: input.weight, active: input.active, name: input.name, description: input.description, ordem: input.ordem })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["score_dimensions"] }),
  });
}

export function useMyScores(months = 6) {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user?.id,
    queryKey: ["my_scores", user?.id, months],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manager_scores_monthly")
        .select("*")
        .eq("user_id", user!.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(months);
      if (error) throw error;
      return ((data ?? []) as any[]).reverse() as ManagerScore[];
    },
  });
}

export function useScoresRanking(year: number, month: number, unitId?: string) {
  return useQuery({
    queryKey: ["scores_ranking", year, month, unitId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("manager_scores_monthly")
        .select("*, profile:profiles!manager_scores_monthly_user_id_fkey(nome,foto_url,cargo,unit_id,unidade)")
        .eq("year", year).eq("month", month)
        .order("final_score", { ascending: false });
      if (unitId) q = q.eq("unit_id", unitId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useScoresHistoryFor(userId?: string, months = 6) {
  return useQuery({
    enabled: !!userId,
    queryKey: ["scores_history", userId, months],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manager_scores_monthly")
        .select("*")
        .eq("user_id", userId!)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(months);
      if (error) throw error;
      return ((data ?? []) as any[]).reverse() as ManagerScore[];
    },
  });
}

export function useTriggerCalculation() {
  return useMutation({
    mutationFn: async ({ year, month, dryRun }: { year?: number; month?: number; dryRun?: boolean } = {}) => {
      const params = new URLSearchParams();
      if (year) params.set("year", String(year));
      if (month) params.set("month", String(month));
      if (dryRun) params.set("dry_run", "1");
      const { data, error } = await supabase.functions.invoke(`calculate-manager-scores?${params.toString()}`);
      if (error) throw error;
      return data;
    },
  });
}
