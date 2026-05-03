import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OrgPerson = {
  id: string;
  user_id: string | null;
  nome: string;
  cargo: string;
  cargo_titulo: string | null;
  setor: string | null;
  gerencia: string | null;
  foto_url: string | null;
  email: string | null;
  telefone: string | null;
  lider_setor_id: string | null;
};

export type UnitOrgData = {
  unit: { id: string; code: string; name: string; type: string | null } | null;
  people: OrgPerson[];
};

export function useUnitOrgData(unitId: string | undefined) {
  return useQuery({
    queryKey: ["unit-org", unitId],
    enabled: !!unitId,
    queryFn: async (): Promise<UnitOrgData> => {
      const [{ data: unit }, { data: people, error }] = await Promise.all([
        supabase.from("units").select("id, code, name, type").eq("id", unitId!).maybeSingle(),
        supabase
          .from("profiles")
          .select("id, user_id, nome, cargo, cargo_titulo, setor, gerencia, foto_url, email, telefone, lider_setor_id, ativo")
          .eq("unit_id", unitId!)
          .eq("ativo", true)
          .order("nome"),
      ]);
      if (error) throw error;
      return {
        unit: (unit as any) ?? null,
        people: ((people ?? []) as any) as OrgPerson[],
      };
    },
  });
}
