import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { useGerentesOverview } from "@/hooks/useMasterData";

export function InsightsDaSemana() {
  const { data: gerentes = [] } = useGerentesOverview();
  const subiu = gerentes.filter((g) => (g.score_delta ?? 0) > 0).sort((a, b) => (b.score_delta ?? 0) - (a.score_delta ?? 0))[0];
  const caiu = gerentes.filter((g) => (g.score_delta ?? 0) < 0).sort((a, b) => (a.score_delta ?? 0) - (b.score_delta ?? 0))[0];

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Insights da semana
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {subiu && (
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-success mt-0.5 shrink-0" />
            <p>
              <span className="font-semibold">{subiu.nome}</span> subiu{" "}
              <span className="text-success font-semibold">+{(subiu.score_delta ?? 0).toFixed(1)}</span> no score.
            </p>
          </div>
        )}
        {caiu && (
          <div className="flex items-start gap-2">
            <TrendingDown className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p>
              <span className="font-semibold">{caiu.nome}</span> caiu{" "}
              <span className="text-destructive font-semibold">{(caiu.score_delta ?? 0).toFixed(1)}</span>. Considere uma 1:1.
            </p>
          </div>
        )}
        {!subiu && !caiu && (
          <p className="text-muted-foreground text-xs">Sem dados suficientes ainda esta semana.</p>
        )}
      </CardContent>
    </Card>
  );
}
