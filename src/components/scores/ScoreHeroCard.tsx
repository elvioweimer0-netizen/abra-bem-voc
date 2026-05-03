import { Card, CardContent } from "@/components/ui/card";
import { Gauge, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { ManagerScore } from "@/hooks/useManagerScore";

export function ScoreHeroCard({ current, previous }: { current?: ManagerScore; previous?: ManagerScore }) {
  if (!current) {
    return (
      <Card className="card-shadow">
        <CardContent className="p-6 text-center text-muted-foreground">
          Seu Score deste mês ainda não foi calculado. Volta no início do próximo mês.
        </CardContent>
      </Card>
    );
  }
  const delta = previous ? current.final_score - previous.final_score : 0;
  const Trend = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? "text-green-600" : delta < 0 ? "text-destructive" : "text-muted-foreground";
  const monthLabel = new Date(current.year, current.month - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return (
    <Card className="card-shadow border-primary/30">
      <CardContent className="p-6 flex items-center gap-6">
        <div className="rounded-full bg-primary/10 p-4">
          <Gauge className="h-10 w-10 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Score de {monthLabel}</p>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold text-foreground">{current.final_score.toFixed(1)}</span>
            <span className="text-lg text-muted-foreground">/ 100</span>
            {previous && (
              <span className={`inline-flex items-center gap-1 text-sm font-medium ${trendColor}`}>
                <Trend className="h-4 w-4" />
                {delta > 0 ? "+" : ""}{delta.toFixed(1)} vs mês anterior
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
