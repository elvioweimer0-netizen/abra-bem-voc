import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ComplaintCategory =
  | "atendimento" | "produto" | "preco" | "fila" | "limpeza" | "estoque" | "outros";
export type ComplaintSeverity = "leve" | "media" | "grave" | "muito_grave";
export type ComplaintStatus = "aberta" | "em_andamento" | "resolvida";

export type Complaint = {
  id: string;
  unit_id: string;
  registered_by_user_id: string | null;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  description: string;
  customer_contact: string | null;
  action_taken: string | null;
  setor: string | null;
  status: ComplaintStatus;
  resolved_at: string | null;
  resolved_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ComplaintFilters = {
  unitId?: string | null;
  category?: ComplaintCategory | null;
  severity?: ComplaintSeverity | null;
  status?: ComplaintStatus | null;
};

export function useComplaints(filters: ComplaintFilters = {}) {
  return useQuery({
    queryKey: ["customer_complaints", filters],
    queryFn: async () => {
      let q = (supabase as any)
        .from("customer_complaints")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (filters.unitId) q = q.eq("unit_id", filters.unitId);
      if (filters.category) q = q.eq("category", filters.category);
      if (filters.severity) q = q.eq("severity", filters.severity);
      if (filters.status) q = q.eq("status", filters.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Complaint[];
    },
  });
}
