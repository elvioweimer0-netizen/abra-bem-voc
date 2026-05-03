import type { HeatmapPeriod } from "@/hooks/useHeatmap";
import { cn } from "@/lib/utils";

const OPTIONS: { value: HeatmapPeriod; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
  { value: "trimestre", label: "Trimestre" },
];

export function PeriodChips({
  value,
  onChange,
}: {
  value: HeatmapPeriod;
  onChange: (v: HeatmapPeriod) => void;
}) {
  return (
    <div className="inline-flex gap-1 p-1 rounded-lg bg-muted">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            value === o.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
