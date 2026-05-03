import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScheduledPills, type CulturePill } from "@/hooks/useCulturePills";

type Props = { onPick: (date: string, existing?: CulturePill) => void };

export function CultureCalendar({ onPick }: Props) {
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const { data: pills = [] } = useScheduledPills(cursor);
  const byDate = useMemo(() => {
    const m = new Map<string, CulturePill>();
    pills.forEach((p) => m.set(p.display_date, p));
    return m;
  }, [pills]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number | null; iso?: string }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, iso });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold capitalize">
          {cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          const pill = c.iso ? byDate.get(c.iso) : undefined;
          return (
            <button
              key={i}
              disabled={!c.iso}
              onClick={() => c.iso && onPick(c.iso, pill)}
              className={`aspect-square rounded-md border text-xs transition-colors ${
                c.iso ? "border-border hover:bg-accent" : "border-transparent"
              }`}
              style={pill?.value ? { backgroundColor: `${pill.value.color}26`, borderColor: pill.value.color } : undefined}
              title={pill?.title}
            >
              {c.day ?? ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
