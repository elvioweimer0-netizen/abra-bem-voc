import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type WellbeingQuestion = {
  id: string;
  code: string;
  question_text: string;
  scale_min: number;
  scale_max: number;
  dimension: string;
  reverse_scoring: boolean;
  ordem: number;
  active: boolean;
};

export function useWellbeingQuestions() {
  return useQuery({
    queryKey: ["wellbeing-questions"],
    queryFn: async (): Promise<WellbeingQuestion[]> => {
      const { data, error } = await (supabase as any)
        .from("wellbeing_questions")
        .select("*")
        .eq("active", true)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as WellbeingQuestion[];
    },
  });
}

export function useMyMonthlyCheckinStatus() {
  return useQuery({
    queryKey: ["wellbeing-my-month-status"],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await (supabase as any).rpc("fn_my_checkin_done_this_month");
      if (error) throw error;
      return !!data;
    },
    staleTime: 60_000,
  });
}

export function useSubmitWellbeingCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { responses: Record<string, number>; notes?: string | null }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");
      const { error } = await (supabase as any).from("wellbeing_checkins").insert({
        user_id: userData.user.id,
        responses: input.responses,
        notes: input.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wellbeing-my-month-status"] });
    },
    onError: (e: any) => {
      const msg = String(e?.message ?? "");
      if (msg.includes("duplicate") || msg.includes("unique")) {
        toast.error("Você já fez seu check-in esse mês. Obrigado!");
      } else {
        toast.error("Não conseguimos salvar agora. Tente novamente em alguns minutos.");
      }
    },
  });
}

export type WellbeingAggregatedRow = {
  unit_id: string;
  month: string;
  count_responses: number;
  avg_composite_score: number;
  pct_ok: number;
  pct_atencao: number;
  pct_alerta: number;
  pct_critico: number;
};

export function useWellbeingAggregated(params: { unit_id?: string | null; from?: string; to?: string }) {
  return useQuery({
    queryKey: ["wellbeing-aggregated", params],
    queryFn: async (): Promise<WellbeingAggregatedRow[]> => {
      const { data, error } = await (supabase as any).rpc("fn_wellbeing_aggregated", {
        _unit_id: params.unit_id ?? null,
        _from: params.from ?? null,
        _to: params.to ?? null,
      });
      if (error) throw error;
      return (data ?? []) as WellbeingAggregatedRow[];
    },
  });
}

export type WellbeingCriticalAlert = {
  user_hash: string;
  unit_id: string | null;
  risk_level: string;
  created_at: string;
};

export function useWellbeingCriticalAlerts() {
  return useQuery({
    queryKey: ["wellbeing-critical-alerts"],
    queryFn: async (): Promise<WellbeingCriticalAlert[]> => {
      const { data, error } = await (supabase as any).rpc("fn_wellbeing_critical_alerts");
      if (error) throw error;
      return (data ?? []) as WellbeingCriticalAlert[];
    },
  });
}
