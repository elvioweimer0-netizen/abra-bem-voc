import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TeamMember = {
  user_id: string;
  nome: string;
  cargo: string;
  cargo_titulo: string | null;
  setor: string | null;
};

export function useUnitTeam(unitId: string | null) {
  return useQuery({
    queryKey: ["unit-team", unitId],
    enabled: !!unitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, cargo, cargo_titulo, setor")
        .eq("unit_id", unitId!)
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data ?? []).filter((p: any) => p.user_id) as TeamMember[];
    },
  });
}
