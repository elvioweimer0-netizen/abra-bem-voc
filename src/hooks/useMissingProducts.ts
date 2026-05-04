import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MissingProductStatus = "aberto" | "em_compras" | "adicionado" | "recusado";

export type MissingProduct = {
  id: string;
  registered_by_user_id: string | null;
  unit_id: string;
  product_name: string;
  brand: string | null;
  category: string | null;
  customer_count: number;
  priority_score: number;
  notes: string | null;
  status: MissingProductStatus;
  status_changed_at: string | null;
  created_at: string;
  updated_at: string;
  registrant?: { nome: string | null; cargo_titulo: string | null } | null;
  unit?: { code: string | null; name: string | null } | null;
};

export function useMissingProducts(opts: {
  status?: MissingProductStatus | "all";
  unitId?: string | null;
  sort?: "priority" | "recent";
} = {}) {
  const { status = "all", unitId = null, sort = "priority" } = opts;
  return useQuery({
    queryKey: ["missing_products", status, unitId, sort],
    queryFn: async () => {
      let q = (supabase as any)
        .from("missing_product_requests")
        .select(`
          id, registered_by_user_id, unit_id, product_name, brand, category,
          customer_count, priority_score, notes, status,
          status_changed_at, created_at, updated_at,
          registrant:profiles!missing_product_requests_registered_by_user_id_fkey(nome, cargo_titulo),
          unit:units!missing_product_requests_unit_id_fkey(code, name)
        `);

      if (status !== "all") q = q.eq("status", status);
      if (unitId) q = q.eq("unit_id", unitId);

      if (sort === "priority") q = q.order("priority_score", { ascending: false });
      else q = q.order("created_at", { ascending: false });

      const { data, error } = await q.limit(200);
      if (error) throw error;
      return (data ?? []) as MissingProduct[];
    },
  });
}

export function useMyMissingProductVotes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["missing_products_my_votes", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: prof } = await (supabase as any)
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!prof?.id) return new Set<string>();

      const { data, error } = await (supabase as any)
        .from("missing_product_upvotes")
        .select("request_id")
        .eq("user_id", prof.id);
      if (error) throw error;
      return new Set<string>((data ?? []).map((r: any) => r.request_id));
    },
  });
}
