import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MysteryCriterion = {
  id: string;
  code: string;
  name: string;
  ordem: number;
  active: boolean;
};

export function useMysteryCriteria() {
  return useQuery({
    queryKey: ["mystery_criteria"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("mystery_visit_criteria")
        .select("id, code, name, ordem, active")
        .eq("active", true)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MysteryCriterion[];
    },
    staleTime: 5 * 60_000,
  });
}
