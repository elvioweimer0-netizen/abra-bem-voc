import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MissingProductMatch = {
  id: string;
  product_name: string;
  brand: string | null;
  category: string | null;
  customer_count: number;
  status: string;
  similarity: number;
};

export function useSearchMissingProducts(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["missing_products_search", trimmed],
    enabled: trimmed.length >= 3,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("fn_search_missing_products", {
        _query: trimmed,
        _limit: 5,
      });
      if (error) throw error;
      return (data ?? []) as MissingProductMatch[];
    },
    staleTime: 30_000,
  });
}
