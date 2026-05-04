import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Complaint, ComplaintCategory } from "./useComplaints";

export type ComplaintTrends = {
  byCategory: Record<ComplaintCategory, number>;
  byUnit: { unit_id: string; total: number; unresolved: number }[];
  total: number;
  unresolved: number;
};

export function useComplaintTrends(days = 30) {
  return useQuery({
    queryKey: ["complaint_trends", days],
    queryFn: async (): Promise<ComplaintTrends> => {
      const since = new Date(Date.now() - days * 86400_000).toISOString();
      const { data, error } = await (supabase as any)
        .from("customer_complaints")
        .select("id, unit_id, category, status, severity, created_at")
        .gte("created_at", since)
        .limit(1000);
      if (error) throw error;
      const rows = (data ?? []) as Complaint[];

      const byCategory = {
        atendimento: 0, produto: 0, preco: 0, fila: 0,
        limpeza: 0, estoque: 0, outros: 0,
      } as Record<ComplaintCategory, number>;

      const unitMap = new Map<string, { unit_id: string; total: number; unresolved: number }>();
      let unresolved = 0;

      for (const r of rows) {
        byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
        const u = unitMap.get(r.unit_id) ?? { unit_id: r.unit_id, total: 0, unresolved: 0 };
        u.total += 1;
        if (r.status !== "resolvida") {
          u.unresolved += 1;
          unresolved += 1;
        }
        unitMap.set(r.unit_id, u);
      }

      return {
        byCategory,
        byUnit: Array.from(unitMap.values()).sort((a, b) => b.total - a.total),
        total: rows.length,
        unresolved,
      };
    },
  });
}
