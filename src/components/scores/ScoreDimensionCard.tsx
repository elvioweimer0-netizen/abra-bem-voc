import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { DimensionBreakdownEntry, ScoreDimension } from "@/hooks/useManagerScore";

export function ScoreDimensionCard({ dimension, entry, networkAvg }: { dimension: ScoreDimension; entry?: DimensionBreakdownEntry; networkAvg?: number }) {
  const skipped = !entry || entry.status === "skipped";
  const value = entry?.raw ?? 0;
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">{dimension.name}</p>
            {dimension.description && <p className="text-xs text-muted-foreground line-clamp-2">{dimension.description}</p>}
          </div>
          <Badge variant="outline" className="text-xs">peso {dimension.weight}%</Badge>
        </div>
        {skipped ? (
          <p className="text-xs italic text-muted-foreground">Sem dados neste mês — peso redistribuído.</p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{value.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
              {typeof networkAvg === "number" && (
                <span className="ml-auto text-xs text-muted-foreground">média rede: {networkAvg.toFixed(1)}</span>
              )}
            </div>
            <Progress value={value} className="h-2" />
          </>
        )}
      </CardContent>
    </Card>
  );
}
