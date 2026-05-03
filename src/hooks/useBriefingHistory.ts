import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CuriozinhoBriefing } from "./useDailyBriefing";

export function useBriefingHistory(monthIso?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["curiozinho-history", user?.id, monthIso ?? "all"],
    enabled: !!user?.id,
    queryFn: async () => {
      let q = supabase
        .from("curiozinho_briefings" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("briefing_date", { ascending: false })
        .limit(180);
      if (monthIso) {
        const [y, m] = monthIso.split("-").map(Number);
        const start = new Date(y, m - 1, 1).toISOString().slice(0, 10);
        const end = new Date(y, m, 0).toISOString().slice(0, 10);
        q = q.gte("briefing_date", start).lte("briefing_date", end);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data as unknown as CuriozinhoBriefing[]) ?? [];
    },
  });
}
