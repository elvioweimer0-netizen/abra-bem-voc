import type { DimensionBreakdownEntry } from "@/hooks/useManagerScore";

export function ScoreMiniBars({ breakdown, dimensionOrder }: { breakdown: Record<string, DimensionBreakdownEntry>; dimensionOrder: string[] }) {
  return (
    <div className="flex items-end gap-0.5 h-8">
      {dimensionOrder.map((code) => {
        const entry = breakdown[code];
        const v = entry?.status === "ok" ? entry.raw : 0;
        const color = v >= 75 ? "bg-green-500" : v >= 50 ? "bg-yellow-500" : v > 0 ? "bg-destructive" : "bg-muted";
        return (
          <div key={code} className="flex flex-col justify-end w-2" title={`${code}: ${v.toFixed(1)}`}>
            <div className={`${color} rounded-sm`} style={{ height: `${Math.max(4, v)}%` }} />
          </div>
        );
      })}
    </div>
  );
}
