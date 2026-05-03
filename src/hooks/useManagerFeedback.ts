import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FeedbackCycle {
  id: string;
  year: number;
  quarter: number;
  opened_at: string;
  closes_at: string;
  status: "aberto" | "fechado" | "consolidado";
}
export interface FeedbackQuestion {
  id: string;
  code: string;
  question_text: string;
  ordem: number;
  scale_min: number;
  scale_max: number;
  active: boolean;
}
export interface AggregatedRow {
  cycle_id: string;
  question_id: string;
  question_code: string;
  question_text: string;
  ordem: number;
  avg_score: number;
  count_responses: number;
  distribution: Record<string, number>;
}

export function useActiveCycle() {
  return useQuery({
    queryKey: ["mf-active-cycle"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("manager_feedback_cycles")
        .select("*")
        .eq("status", "aberto")
        .gt("closes_at", new Date().toISOString())
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as FeedbackCycle | null) ?? null;
    },
  });
}

export function useAllCycles() {
  return useQuery({
    queryKey: ["mf-cycles"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("manager_feedback_cycles")
        .select("*")
        .order("year", { ascending: false })
        .order("quarter", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FeedbackCycle[];
    },
  });
}

export function useFeedbackQuestions() {
  return useQuery({
    queryKey: ["mf-questions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("manager_feedback_questions")
        .select("*")
        .eq("active", true)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FeedbackQuestion[];
    },
  });
}

export function useAlreadyAnswered(cycleId?: string) {
  return useQuery({
    queryKey: ["mf-answered", cycleId],
    enabled: !!cycleId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("fn_user_already_answered_cycle", { _cycle_id: cycleId });
      if (error) throw error;
      return !!data;
    },
  });
}

export function useMyManager() {
  const { user, profile } = useAuth();
  return useQuery({
    queryKey: ["my-manager", user?.id],
    enabled: !!user?.id && !!(profile as any)?.unit_id,
    queryFn: async () => {
      const unit_id = (profile as any).unit_id;
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, foto_url, cargo, cargo_titulo, unit_id")
        .eq("unit_id", unit_id)
        .in("cargo", ["gerente_loja", "gerente"])
        .eq("ativo", true)
        .neq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSubmitFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      cycle_id: string;
      manager_user_id: string;
      answers: { question_id: string; score: number; comment?: string }[];
    }) => {
      const rows = input.answers.map((a) => ({
        cycle_id: input.cycle_id,
        manager_user_id: input.manager_user_id,
        question_id: a.question_id,
        score: a.score,
        comment: a.comment ?? null,
        respondent_hash: "server-overrides", // trigger sobrescreve
      }));
      const { error } = await (supabase as any).from("manager_feedback_responses").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feedback enviado anonimamente. Obrigado!");
      qc.invalidateQueries({ queryKey: ["mf-answered"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao enviar"),
  });
}

export function useManagerAggregated(managerUserId?: string, cycleId?: string | null) {
  return useQuery({
    queryKey: ["mf-aggregated", managerUserId, cycleId ?? "all"],
    enabled: !!managerUserId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("fn_manager_feedback_aggregated", {
        _manager_user_id: managerUserId,
        _cycle_id: cycleId ?? null,
      });
      if (error) throw error;
      return (data ?? []) as AggregatedRow[];
    },
  });
}

export function useManagerComments(managerUserId?: string, cycleId?: string) {
  return useQuery({
    queryKey: ["mf-comments", managerUserId, cycleId],
    enabled: !!managerUserId && !!cycleId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("fn_manager_feedback_comments", {
        _manager_user_id: managerUserId,
        _cycle_id: cycleId,
      });
      if (error) throw error;
      return ((data ?? []) as { comment: string }[]).map((r) => r.comment);
    },
  });
}

export function useAllManagers() {
  return useQuery({
    queryKey: ["mf-all-managers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, unit_id, cargo")
        .in("cargo", ["gerente_loja", "gerente"])
        .eq("ativo", true);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; year: number; quarter: number; closes_at: string; status?: string }) => {
      if (input.id) {
        const { error } = await (supabase as any)
          .from("manager_feedback_cycles")
          .update({ closes_at: input.closes_at, status: input.status ?? "aberto" })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("manager_feedback_cycles").insert({
          year: input.year, quarter: input.quarter, closes_at: input.closes_at,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Ciclo salvo");
      qc.invalidateQueries({ queryKey: ["mf-cycles"] });
      qc.invalidateQueries({ queryKey: ["mf-active-cycle"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
}
