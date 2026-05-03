import { Card, CardContent } from "@/components/ui/card";
import type { AggregatedRow } from "@/hooks/useManagerFeedback";

interface Props { row: AggregatedRow }

export function ManagerScoreCard({ row }: Props) {
  const total = Object.values(row.distribution).reduce((a, b) => a + Number(b), 0);
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{row.question_text}</p>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{row.avg_score.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">média</p>
          </div>
        </div>
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map((n) => {
            const c = Number(row.distribution[String(n)] ?? 0);
            const pct = total > 0 ? Math.round((c / total) * 100) : 0;
            return (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted-foreground">{n}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-12 text-right text-muted-foreground">{c} · {pct}%</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground">{row.count_responses} respostas anônimas</p>
      </CardContent>
    </Card>
  );
}
