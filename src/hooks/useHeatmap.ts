import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";

export type HeatmapPeriod = "hoje" | "semana" | "mes" | "trimestre";

export type HeatmapRow = {
  unit_id: string;
  total_advertencias: number;
  total_ocorrencias: number;
  total_suspensoes: number;
  total_checklist_atrasados: number;
  total_faltas_setor: number;
  total_vagas_abertas: number;
  mood_baixo_count: number;
  avisos_pendentes: number;
  total_complaints: number;
};

export function useHeatmap(period: HeatmapPeriod) {
  const { data: units } = useAccessibleUnits();
  return useQuery({
    queryKey: ["heatmap", period, units?.map((u) => u.id).join(",")],
    enabled: !!units,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("fn_heatmap_indicators", { _period: period });
      if (error) throw error;
      const rows = (data ?? []) as HeatmapRow[];
      const allowed = new Set((units ?? []).map((u) => u.id));
      const filtered = rows.filter((r) => allowed.has(r.unit_id));
      const unitMap = new Map((units ?? []).map((u) => [u.id, u]));
      return filtered
        .map((r) => ({ ...r, unit: unitMap.get(r.unit_id) }))
        .sort((a, b) => (a.unit?.code ?? "").localeCompare(b.unit?.code ?? ""));
    },
  });
}
