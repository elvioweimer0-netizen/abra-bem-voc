import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeatmapTable } from "@/components/heatmap/HeatmapTable";
import { PeriodChips } from "@/components/heatmap/PeriodChips";
import type { HeatmapPeriod } from "@/hooks/useHeatmap";

export default function Heatmap() {
  const [period, setPeriod] = useState<HeatmapPeriod>("mes");
  const qc = useQueryClient();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Heatmap de pendências</h1>
          <p className="text-sm text-muted-foreground">
            Mapa rápido por unidade. Atualiza a cada 60s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodChips value={period} onChange={setPeriod} />
          <Button
            variant="outline"
            size="icon"
            onClick={() => qc.invalidateQueries({ queryKey: ["heatmap"] })}
            aria-label="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <HeatmapTable period={period} />
    </div>
  );
}
