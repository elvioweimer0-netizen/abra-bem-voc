import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Journey = {
  id: string;
  user_id: string;
  started_at: string;
  expected_completion_date: string;
  completed_at: string | null;
  total_modules: number;
  completed_modules: number;
  status: "em_andamento" | "concluido" | "atrasado";
  last_activity_at: string | null;
};

export type OnboardingModule = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  ordem: number;
  active: boolean;
  onboarding_track: boolean;
  status: "completed" | "unlocked" | "locked";
};

export function useMyJourney() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user?.id,
    queryKey: ["onboarding_my_journey", user?.id],
    queryFn: async () => {
      const { data: journey } = await supabase
        .from("onboarding_journeys")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      const { data: modules } = await supabase
        .from("training_modules")
        .select("id,title,description,thumbnail_url,duration_seconds,ordem,active,onboarding_track")
        .eq("active", true)
        .eq("onboarding_track", true)
        .order("ordem");

      const { data: completions } = await supabase
        .from("training_completions")
        .select("module_id")
        .eq("user_id", user!.id);

      const doneIds = new Set((completions ?? []).map((c: any) => c.module_id));
      let nextUnlockedFound = false;
      const enriched: OnboardingModule[] = (modules ?? []).map((m: any) => {
        let status: OnboardingModule["status"];
        if (doneIds.has(m.id)) status = "completed";
        else if (!nextUnlockedFound) { status = "unlocked"; nextUnlockedFound = true; }
        else status = "locked";
        return { ...m, status };
      });

      return { journey: (journey as Journey | null) ?? null, modules: enriched };
    },
  });
}

export function useHasActiveJourney() {
  const { data } = useMyJourney();
  return data?.journey?.status === "em_andamento" || data?.journey?.status === "atrasado";
}

export function useJourneysAdmin(filter: { status?: string; unitId?: string } = {}) {
  return useQuery({
    queryKey: ["onboarding_admin", filter.status ?? "all", filter.unitId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("onboarding_journeys")
        .select("*, profile:profiles!onboarding_journeys_user_id_fkey(nome,foto_url,cargo,unit_id,unidade)")
        .order("started_at", { ascending: false });
      if (filter.status) q = q.eq("status", filter.status);
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as any[];
      return filter.unitId ? rows.filter((r) => r.profile?.unit_id === filter.unitId) : rows;
    },
  });
}

export function useUnitOnboardings(unitId?: string) {
  return useQuery({
    enabled: !!unitId,
    queryKey: ["onboarding_unit", unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_journeys")
        .select("*, profile:profiles!onboarding_journeys_user_id_fkey(nome,foto_url,unit_id)")
        .in("status", ["em_andamento", "atrasado"]);
      if (error) throw error;
      return ((data ?? []) as any[]).filter((r) => r.profile?.unit_id === unitId);
    },
  });
}

export function useToggleOnboardingTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("training_modules").update({ onboarding_track: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training_modules"] });
      qc.invalidateQueries({ queryKey: ["onboarding_my_journey"] });
    },
  });
}

export function useResendIncentive() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("send_onboarding_incentive", { _user_id: userId });
      if (error) throw error;
    },
  });
}
