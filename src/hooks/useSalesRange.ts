import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SalesRangeRow = {
  metric_date: string;
  revenue: number;
  transactions: number;
  ticket_avg: number;
};

export function useSalesRange(unitId: string | undefined, from: string, to: string) {
  return useQuery({
    queryKey: ["sales-range", unitId, from, to],
    enabled: !!unitId,
    staleTime: 60_000,
    queryFn: async (): Promise<SalesRangeRow[]> => {
      const { data, error } = await (supabase as any).rpc("fn_sales_range", {
        _unit_id: unitId,
        _from: from,
        _to: to,
      });
      if (error) throw error;
      return (data ?? []) as SalesRangeRow[];
    },
  });
}

export type UnitsCompareRow = { unit_id: string; unit_name: string; revenue: number; transactions: number };

export function useSalesCompareUnits(from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: ["sales-compare", from, to],
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<UnitsCompareRow[]> => {
      const { data, error } = await (supabase as any).rpc("fn_sales_compare_units", { _from: from, _to: to });
      if (error) throw error;
      return (data ?? []) as UnitsCompareRow[];
    },
  });
}
