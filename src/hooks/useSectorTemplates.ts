import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SectorTemplate = {
  id: string;
  unit_id: string | null;
  unit_kind: "loja" | "cp" | "cd" | "cpa" | "adm";
  sector_name: string;
  ordem: number;
  icon: string | null;
  active: boolean;
};

export function useSectorTemplates(unitKind: string | null | undefined, unitId?: string | null) {
  return useQuery({
    queryKey: ["sector-templates", unitKind, unitId],
    enabled: !!unitKind,
    queryFn: async (): Promise<SectorTemplate[]> => {
      const { data, error } = await (supabase as any)
        .from("unit_sector_templates")
        .select("*")
        .eq("unit_kind", unitKind!)
        .eq("active", true)
        .order("ordem", { ascending: true });
      if (error) throw error;
      const all = (data ?? []) as SectorTemplate[];
      // Prefer unit-specific overrides, fallback to globals
      const specific = all.filter((t) => t.unit_id === unitId);
      const globals = all.filter((t) => t.unit_id === null);
      const seen = new Set(specific.map((s) => s.sector_name.toLowerCase()));
      return [...specific, ...globals.filter((g) => !seen.has(g.sector_name.toLowerCase()))]
        .sort((a, b) => a.ordem - b.ordem);
    },
  });
}
