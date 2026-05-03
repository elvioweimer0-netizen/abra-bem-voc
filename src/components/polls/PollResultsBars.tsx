import type { PollOption } from "@/hooks/usePolls";

const COLORS = ["bg-primary", "bg-emerald-500", "bg-amber-500", "bg-violet-500"];

interface Props {
  options: PollOption[];
  counts: Record<string, number>;
  total: number;
  highlightOptionId?: string | null;
}

export function PollResultsBars({ options, counts, total, highlightOptionId }: Props) {
  return (
    <div className="space-y-2">
      {options.map((o, i) => {
        const c = counts[o.id] ?? 0;
        const pct = total > 0 ? Math.round((c / total) * 100) : 0;
        const isMine = highlightOptionId === o.id;
        return (
          <div key={o.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${isMine ? "text-foreground" : "text-foreground/80"}`}>
                {o.label} {isMine && <span className="text-xs text-primary">(seu voto)</span>}
              </span>
              <span className="text-xs text-muted-foreground">{c} · {pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className={`h-full ${COLORS[i % COLORS.length]} transition-all`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <p className="pt-1 text-xs text-muted-foreground">{total} {total === 1 ? "voto" : "votos"}</p>
    </div>
  );
}
