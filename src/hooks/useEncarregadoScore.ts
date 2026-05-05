import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type EncarregadoScore = {
  id: string;
  encarregado_user_id: string;
  unit_id: string | null;
  year: number;
  month: number;
  score: number;
  components: Record<string, number>;
  calculated_at: string;
};

export function useMyEncarregadoScore() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user?.id,
    queryKey: ["encarregado-score", user?.id],
    queryFn: async (): Promise<EncarregadoScore[]> => {
      const { data, error } = await (supabase as any)
        .from("encarregado_scores")
        .select("*")
        .eq("encarregado_user_id", user!.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as EncarregadoScore[];
    },
  });
}
