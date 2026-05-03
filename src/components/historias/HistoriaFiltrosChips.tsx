import { Badge } from "@/components/ui/badge";
import { CultureValue } from "@/hooks/useCulturePills";
import { cn } from "@/lib/utils";

export function HistoriaFiltrosChips({
  values,
  selected,
  onSelect,
}: {
  values: CultureValue[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => onSelect(null)}>
        <Badge variant={selected === null ? "default" : "outline"} className={cn("cursor-pointer", selected === null && "bg-primary")}>Todos</Badge>
      </button>
      {values.map((v) => (
        <button key={v.id} onClick={() => onSelect(v.id)}>
          <Badge variant={selected === v.id ? "default" : "outline"} className="cursor-pointer">{v.name}</Badge>
        </button>
      ))}
    </div>
  );
}
