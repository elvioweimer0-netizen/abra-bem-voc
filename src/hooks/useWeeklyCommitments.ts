import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type CommitmentStatus = "em_andamento" | "cumprido" | "parcial" | "nao_cumprido" | "cancelado";

export type Commitment = {
  id: string;
  user_id: string;
  unit_id: string | null;
  week_start_date: string;
  commitment_text: string;
  ordem: number;
  status: CommitmentStatus;
  evidencia: string;
  evaluated_at: string | null;
  created_at: string;
  updated_at: string;
};

export function getMonday(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=dom .. 6=sab
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function getWeekRangeLabel(weekStartISO: string) {
  const d = new Date(weekStartISO + "T12:00:00");
  const end = new Date(d); end.setDate(d.getDate() + 4);
  const fmt = (x: Date) => x.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${fmt(d)} a ${fmt(end)}`;
}

export function useMyCommitments(weekStart: string) {
  const { profile } = useAuth();
  const uid = (profile as any)?.user_id as string | undefined;
  return useQuery({
    queryKey: ["commitments", "mine", uid, weekStart],
    enabled: !!uid,
    queryFn: async (): Promise<Commitment[]> => {
      const { data, error } = await supabase
        .from("weekly_commitments")
        .select("*")
        .eq("user_id", uid!)
        .eq("week_start_date", weekStart)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as Commitment[];
    },
  });
}

export function useCommitmentHistory(userId?: string, weeks = 8) {
  return useQuery({
    queryKey: ["commitments", "history", userId, weeks],
    enabled: !!userId,
    queryFn: async (): Promise<Commitment[]> => {
      const since = new Date();
      since.setDate(since.getDate() - weeks * 7);
      const { data, error } = await supabase
        .from("weekly_commitments")
        .select("*")
        .eq("user_id", userId!)
        .gte("week_start_date", since.toISOString().slice(0, 10))
        .order("week_start_date", { ascending: false })
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as Commitment[];
    },
  });
}

export function useCommitmentsBoard(weekStart: string) {
  return useQuery({
    queryKey: ["commitments", "board", weekStart],
    queryFn: async (): Promise<Commitment[]> => {
      const { data, error } = await supabase
        .from("weekly_commitments")
        .select("*")
        .eq("week_start_date", weekStart)
        .order("user_id")
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as Commitment[];
    },
  });
}

export function useDeclareCommitments() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async (texts: string[]) => {
      const uid = (profile as any)?.user_id as string;
      const unitId = (profile as any)?.unit_id ?? null;
      const week = getMonday();
      const rows = texts
        .map((t, i) => ({ ordem: i + 1, commitment_text: t.trim() }))
        .filter((r) => r.commitment_text.length >= 10)
        .slice(0, 3)
        .map((r) => ({
          user_id: uid,
          unit_id: unitId,
          week_start_date: week,
          commitment_text: r.commitment_text,
          ordem: r.ordem,
          status: "em_andamento" as const,
        }));
      if (!rows.length) throw new Error("Adicione ao menos um compromisso");
      const { error } = await supabase
        .from("weekly_commitments")
        .upsert(rows, { onConflict: "user_id,week_start_date,ordem" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Compromissos publicados");
      qc.invalidateQueries({ queryKey: ["commitments"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao publicar"),
  });
}

export function useEvaluateCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: CommitmentStatus; evidencia: string }) => {
      const { error } = await supabase
        .from("weekly_commitments")
        .update({
          status: input.status,
          evidencia: input.evidencia,
          evaluated_at: new Date().toISOString(),
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commitments"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao avaliar"),
  });
}
