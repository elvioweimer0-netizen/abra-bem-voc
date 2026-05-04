import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SalesTarget = {
  id: string;
  unit_id: string;
  year: number;
  month: number;
  target_revenue: number;
  target_transactions: number;
};

export function useSalesTargets(year: number, month: number) {
  return useQuery({
    queryKey: ["sales-targets", year, month],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sales_targets")
        .select("id, unit_id, year, month, target_revenue, target_transactions")
        .eq("year", year)
        .eq("month", month);
      if (error) throw error;
      return (data ?? []) as SalesTarget[];
    },
  });
}

export function useUpsertSalesTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { unit_id: string; year: number; month: number; target_revenue: number; target_transactions: number }) => {
      const { error } = await (supabase as any)
        .from("sales_targets")
        .upsert(input, { onConflict: "unit_id,year,month" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meta salva");
      qc.invalidateQueries({ queryKey: ["sales-targets"] });
      qc.invalidateQueries({ queryKey: ["sales-today"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar meta"),
  });
}
