import { useState } from "react";
import { useHeatmap, type HeatmapPeriod, type HeatmapRow } from "@/hooks/useHeatmap";
import { HeatmapCell } from "./HeatmapCell";
import { HeatmapDetailDrawer } from "./HeatmapDetailDrawer";

type IndicatorDef = {
  key: string;
  label: string;
  field: keyof HeatmapRow;
  thresholds: [number, number];
};

const INDICATORS: IndicatorDef[] = [
  { key: "advertencias", label: "Advertências", field: "total_advertencias", thresholds: [0, 2] },
  { key: "ocorrencias", label: "Ocorrências", field: "total_ocorrencias", thresholds: [0, 1] },
  { key: "suspensoes", label: "Suspensões", field: "total_suspensoes", thresholds: [0, 0] },
  { key: "checklist", label: "Checklist atrasado", field: "total_checklist_atrasados", thresholds: [0, 2] },
  { key: "faltas", label: "Faltas", field: "total_faltas_setor", thresholds: [0, 1] },
  { key: "vagas", label: "Vagas abertas", field: "total_vagas_abertas", thresholds: [0, 0] },
  { key: "mood_baixo", label: "Humor baixo", field: "mood_baixo_count", thresholds: [0, 3] },
  { key: "avisos_pend", label: "Avisos pendentes", field: "avisos_pendentes", thresholds: [0, 0] },
  { key: "complaints", label: "Reclamações de cliente", field: "total_complaints", thresholds: [0, 3] },
];

export function HeatmapTable({ period }: { period: HeatmapPeriod }) {
  const { data, isLoading } = useHeatmap(period);
  const [drawer, setDrawer] = useState<null | {
    indicatorKey: string;
    indicatorLabel: string;
    unitId: string;
    unitCode: string;
    unitName: string;
    value: number;
  }>(null);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando indicadores…</p>;
  }
  if (!data?.length) {
    return <p className="text-sm text-muted-foreground">Sem unidades acessíveis.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold text-muted-foreground p-2 sticky left-0 bg-background z-10 min-w-[160px]">
                Indicador
              </th>
              {data.map((u) => (
                <th key={u.unit_id} className="text-xs font-semibold text-foreground p-2 text-center min-w-[80px]">
                  {(u as any).unit?.code ?? "—"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INDICATORS.map((ind) => (
              <tr key={ind.key}>
                <td className="text-sm font-medium text-foreground p-2 sticky left-0 bg-background z-10">
                  {ind.label}
                </td>
                {data.map((u) => {
                  const value = Number(u[ind.field] ?? 0);
                  return (
                    <td key={u.unit_id} className="p-1 align-top">
                      <HeatmapCell
                        value={value}
                        thresholds={ind.thresholds}
                        onClick={() =>
                          setDrawer({
                            indicatorKey: ind.key,
                            indicatorLabel: ind.label,
                            unitId: u.unit_id,
                            unitCode: (u as any).unit?.code ?? "",
                            unitName: (u as any).unit?.name ?? "—",
                            value,
                          })
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawer && (
        <HeatmapDetailDrawer
          open
          onClose={() => setDrawer(null)}
          {...drawer}
        />
      )}
    </>
  );
}
