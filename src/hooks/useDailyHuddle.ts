import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type MetaStatus = "no_caminho" | "em_risco" | "atingida" | "nao_atingida";

export type HuddleReport = {
  id: string;
  report_date: string;
  unit_id: string;
  author_user_id: string | null;
  bo_dia: string;
  informativos: string;
  venda_dia_anterior: number | null;
  meta_dia: number | null;
  meta_status: MetaStatus;
  observacao: string;
  submitted_at: string;
  updated_at: string;
};

export type HuddleInput = {
  report_date?: string;
  unit_id: string;
  bo_dia: string;
  informativos: string;
  venda_dia_anterior: number | null;
  meta_dia: number | null;
  meta_status: MetaStatus;
  observacao: string;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export function useTodayHuddle(unitId?: string | null, date?: string) {
  const d = date ?? todayISO();
  return useQuery({
    queryKey: ["daily-huddle", "today", unitId, d],
    enabled: !!unitId,
    queryFn: async (): Promise<HuddleReport | null> => {
      const { data, error } = await supabase
        .from("daily_huddle_reports")
        .select("*")
        .eq("unit_id", unitId!)
        .eq("report_date", d)
        .maybeSingle();
      if (error) throw error;
      return (data as HuddleReport) ?? null;
    },
  });
}

export function useHuddleHistory(unitId?: string | null, days = 7) {
  return useQuery({
    queryKey: ["daily-huddle", "history", unitId, days],
    enabled: !!unitId,
    queryFn: async (): Promise<HuddleReport[]> => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await supabase
        .from("daily_huddle_reports")
        .select("*")
        .eq("unit_id", unitId!)
        .gte("report_date", since.toISOString().slice(0, 10))
        .order("report_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as HuddleReport[];
    },
  });
}

export function useHuddlePanel(date?: string) {
  const d = date ?? todayISO();
  return useQuery({
    queryKey: ["daily-huddle", "panel", d],
    queryFn: async (): Promise<HuddleReport[]> => {
      const { data, error } = await supabase
        .from("daily_huddle_reports")
        .select("*")
        .eq("report_date", d);
      if (error) throw error;
      return (data ?? []) as HuddleReport[];
    },
  });
}

export function useUpsertHuddle() {
  const qc = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (input: HuddleInput) => {
      const userId = (profile as any)?.user_id;
      if (!userId) throw new Error("Sessão inválida");
      const payload = {
        ...input,
        report_date: input.report_date ?? todayISO(),
        author_user_id: userId,
      };
      const { data, error } = await supabase
        .from("daily_huddle_reports")
        .upsert(payload, { onConflict: "report_date,unit_id" })
        .select()
        .single();
      if (error) throw error;
      return data as HuddleReport;
    },
    onSuccess: () => {
      toast.success("Daily registrado");
      qc.invalidateQueries({ queryKey: ["daily-huddle"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar daily"),
  });
}
