import type { PollOption } from "@/hooks/usePolls";

interface Props {
  options: PollOption[];
  breakdown: Record<string, Record<string, number>>;
}

export function PollUnitBreakdown({ options, breakdown }: Props) {
  const units = Object.keys(breakdown).sort();
  if (!units.length) return <p className="text-sm text-muted-foreground">Sem votos por unidade ainda.</p>;
  return (
    <div className="space-y-3">
      {units.map((u) => {
        const totals = breakdown[u];
        const sum = Object.values(totals).reduce((a, b) => a + b, 0);
        return (
          <div key={u} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">{u}</p>
              <p className="text-xs text-muted-foreground">{sum} votos</p>
            </div>
            <div className="space-y-1">
              {options.map((o) => {
                const c = totals[o.id] ?? 0;
                const pct = sum > 0 ? Math.round((c / sum) * 100) : 0;
                return (
                  <div key={o.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{o.label}</span>
                    <span className="font-medium text-foreground">{c} · {pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
