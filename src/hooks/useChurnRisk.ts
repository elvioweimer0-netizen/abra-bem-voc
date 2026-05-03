import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ChurnRisk = {
  id: string;
  user_id: string;
  unit_id: string | null;
  calculated_at: string;
  risk_score: number;
  signals: Array<{ code: string; weight: number; detail?: string }>;
  recommended_action: string | null;
  gerente_notified_at: string | null;
  rh_escalated_at: string | null;
  status: "ativo" | "resolvido_1on1" | "resolvido_outro" | "falso_positivo" | "colaborador_saiu";
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: { nome: string | null; cargo: string | null } | null;
  unit?: { name: string | null } | null;
};

export function useChurnRiskList(filters: { unitId?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ["churn-risk-list", filters],
    queryFn: async () => {
      let q = (supabase as any)
        .from("churn_risk_signals")
        .select("*, profile:profiles!churn_risk_signals_user_id_fkey(nome, cargo), unit:units(name)")
        .order("calculated_at", { ascending: false })
        .order("risk_score", { ascending: false })
        .limit(200);
      if (filters.unitId) q = q.eq("unit_id", filters.unitId);
      if (filters.status) q = q.eq("status", filters.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ChurnRisk[];
    },
  });
}

export function useChurnRiskByUser(userId: string | undefined) {
  return useQuery({
    queryKey: ["churn-risk-user", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("churn_risk_signals")
        .select("*, profile:profiles!churn_risk_signals_user_id_fkey(nome, cargo), unit:units(name)")
        .eq("user_id", userId)
        .order("calculated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChurnRisk[];
    },
  });
}

export function useTopChurnRisksForUnit(unitId: string | undefined, limit = 3) {
  return useQuery({
    queryKey: ["churn-risk-top", unitId, limit],
    enabled: !!unitId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("churn_risk_signals")
        .select("*, profile:profiles!churn_risk_signals_user_id_fkey(nome, cargo)")
        .eq("unit_id", unitId)
        .eq("status", "ativo")
        .order("risk_score", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as ChurnRisk[];
    },
  });
}

export function useResolveChurnRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; status: string; note: string }) => {
      const { error } = await (supabase as any).rpc("resolve_churn_risk", {
        _id: params.id,
        _status: params.status,
        _note: params.note,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["churn-risk-list"] });
      qc.invalidateQueries({ queryKey: ["churn-risk-user"] });
      qc.invalidateQueries({ queryKey: ["churn-risk-top"] });
    },
  });
}

export const SIGNAL_LABELS: Record<string, string> = {
  humor_baixo_5d: "Humor baixo 5d",
  advertencia_30d: "Advertência 30d",
  sem_kudos_30d: "Sem reconhecimento 30d",
  leitura_baixa: "Baixa leitura de avisos",
  sem_huddle_atendimento: "Sem huddle/atendimento",
  sem_acesso_7d: "Sem acesso 7d",
};

export const STATUS_LABELS: Record<string, string> = {
  ativo: "Ativo",
  resolvido_1on1: "Resolvido após 1:1",
  resolvido_outro: "Resolvido (outro)",
  falso_positivo: "Falso positivo",
  colaborador_saiu: "Colaborador saiu",
};
