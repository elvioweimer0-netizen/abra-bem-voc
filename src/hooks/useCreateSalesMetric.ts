import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCreateSalesMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      unit_id: string;
      metric_date: string;
      metric_hour?: number | null;
      revenue: number;
      transactions: number;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from("sales_metrics").insert({
        ...input,
        metric_hour: input.metric_hour ?? null,
        source: "manual",
        created_by: userData.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Venda registrada");
      qc.invalidateQueries({ queryKey: ["sales-today"] });
      qc.invalidateQueries({ queryKey: ["sales-range"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao registrar venda"),
  });
}

export function useImportSalesCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { unit_id: string; csv_text: string }) => {
      const { data, error } = await supabase.functions.invoke("import-sales-csv", { body: input });
      if (error) throw error;
      return data as { ok: boolean; inserted: number; total: number };
    },
    onSuccess: (data) => {
      toast.success(`Importado: ${data.inserted}/${data.total} linhas`);
      qc.invalidateQueries({ queryKey: ["sales-today"] });
      qc.invalidateQueries({ queryKey: ["sales-range"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao importar CSV"),
  });
}
