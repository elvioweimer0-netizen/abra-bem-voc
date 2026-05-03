import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type PdiStatus =
  | "em_andamento"
  | "atingida"
  | "parcialmente_atingida"
  | "nao_atingida"
  | "cancelada";

export type PdiGoal = {
  id: string;
  encarregado_user_id: string;
  gerente_user_id: string | null;
  unit_id: string | null;
  trimestre: number;
  ano: number;
  titulo: string;
  descricao: string;
  meta_valor: number | null;
  meta_unidade: string | null;
  valor_atual: number | null;
  status: PdiStatus;
  prazo: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

export type PdiProgressUpdate = {
  id: string;
  goal_id: string;
  autor_user_id: string;
  valor_atual: number | null;
  observacao: string;
  created_at: string;
};

export function currentTrimestre(d = new Date()) {
  return Math.floor(d.getMonth() / 3) + 1;
}

export type PdiFilters = {
  trimestre?: number;
  ano?: number;
  unit_id?: string;
  status?: PdiStatus;
};

async function fetchGoals(filters: PdiFilters & { encarregado_user_id?: string }) {
  let q = (supabase as any).from("pdi_goals").select("*").order("created_at", { ascending: false });
  if (filters.encarregado_user_id) q = q.eq("encarregado_user_id", filters.encarregado_user_id);
  if (filters.trimestre) q = q.eq("trimestre", filters.trimestre);
  if (filters.ano) q = q.eq("ano", filters.ano);
  if (filters.unit_id) q = q.eq("unit_id", filters.unit_id);
  if (filters.status) q = q.eq("status", filters.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PdiGoal[];
}

export function useMyGoals(trimestre?: number, ano?: number) {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["pdi-my", profile?.user_id, trimestre, ano],
    enabled: !!profile?.user_id,
    queryFn: () =>
      fetchGoals({ encarregado_user_id: profile!.user_id, trimestre, ano }),
  });
}

export function useTeamGoals(filters: PdiFilters = {}) {
  return useQuery({
    queryKey: ["pdi-team", filters],
    queryFn: () => fetchGoals(filters),
  });
}

export function useAdminGoals(filters: PdiFilters = {}) {
  return useQuery({
    queryKey: ["pdi-admin", filters],
    queryFn: () => fetchGoals(filters),
  });
}

export function useGoalUpdates(goalId: string | null) {
  return useQuery({
    queryKey: ["pdi-updates", goalId],
    enabled: !!goalId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pdi_progress_updates")
        .select("*")
        .eq("goal_id", goalId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PdiProgressUpdate[];
    },
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      encarregado_user_id: string;
      unit_id: string;
      trimestre: number;
      ano: number;
      titulo: string;
      descricao: string;
      meta_valor?: number | null;
      meta_unidade?: string | null;
      prazo?: string | null;
    }) => {
      const { data, error } = await (supabase as any).from("pdi_goals").insert({
        ...input,
        gerente_user_id: profile?.user_id,
      }).select().single();
      if (error) throw error;
      return data as PdiGoal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdi-team"] });
      qc.invalidateQueries({ queryKey: ["pdi-admin"] });
      qc.invalidateQueries({ queryKey: ["pdi-my"] });
      toast.success("Meta criada");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar meta"),
  });
}

export function useAddProgress() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async (input: { goal_id: string; observacao: string; valor_atual?: number | null }) => {
      const { error } = await (supabase as any).from("pdi_progress_updates").insert({
        ...input,
        autor_user_id: profile?.user_id,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["pdi-updates", vars.goal_id] });
      qc.invalidateQueries({ queryKey: ["pdi-my"] });
      qc.invalidateQueries({ queryKey: ["pdi-team"] });
      qc.invalidateQueries({ queryKey: ["pdi-admin"] });
      toast.success("Atualização registrada");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao registrar atualização"),
  });
}

export function useUpdateGoalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: PdiStatus }) => {
      const patch: any = { status: input.status };
      if (input.status !== "em_andamento") patch.closed_at = new Date().toISOString();
      const { error } = await (supabase as any).from("pdi_goals").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdi-my"] });
      qc.invalidateQueries({ queryKey: ["pdi-team"] });
      qc.invalidateQueries({ queryKey: ["pdi-admin"] });
      toast.success("Status atualizado");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar status"),
  });
}

export function usePeopleByUnit(unitId?: string | null) {
  return useQuery({
    queryKey: ["pdi-people-by-unit", unitId],
    enabled: !!unitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, cargo, unit_id")
        .eq("unit_id", unitId!)
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProfilesByIds(ids: string[]) {
  return useQuery({
    queryKey: ["pdi-profiles-by-ids", ids.sort().join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, cargo, unit_id")
        .in("user_id", ids);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export const STATUS_LABEL: Record<PdiStatus, string> = {
  em_andamento: "Em andamento",
  atingida: "Atingida",
  parcialmente_atingida: "Parcialmente atingida",
  nao_atingida: "Não atingida",
  cancelada: "Cancelada",
};
