import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SalesTodaySummary = {
  date: string;
  unit_id: string;
  revenue_today: number;
  transactions_today: number;
  revenue_yesterday: number;
  revenue_last_week_same_dow: number;
  target_month_revenue: number;
  target_month_transactions: number;
  target_today_prorated: number;
  target_daily: number;
  achievement_pct: number | null;
  last_updated_at: string | null;
};

export function useSalesToday(unitId: string | undefined) {
  return useQuery({
    queryKey: ["sales-today", unitId],
    enabled: !!unitId,
    staleTime: 0,
    refetchInterval: 5 * 60 * 1000,
    queryFn: async (): Promise<SalesTodaySummary | null> => {
      const { data, error } = await (supabase as any).rpc("fn_sales_today_summary", { _unit_id: unitId });
      if (error) throw error;
      return data as SalesTodaySummary | null;
    },
  });
}
