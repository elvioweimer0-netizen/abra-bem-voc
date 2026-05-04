import { cn } from "@/lib/utils";
import type { Shift } from "@/hooks/useShifts";

const setorTone: Record<string, string> = {
  acougue: "bg-primary/15 border-primary/40 text-primary",
  padaria: "bg-warning/15 border-warning/40 text-warning",
  hortifruti: "bg-success/15 border-success/40 text-success",
  flv: "bg-success/15 border-success/40 text-success",
  mercearia: "bg-secondary/30 border-secondary text-secondary-foreground",
  frente_caixa: "bg-accent/40 border-accent text-accent-foreground",
  deposito: "bg-muted border-border text-muted-foreground",
  geral: "bg-card border-border text-foreground",
};

export function ShiftCell({ shift, conflict, onDragStart, onClick }: {
  shift: Shift;
  conflict?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onClick?: () => void;
}) {
  const tone = setorTone[shift.setor ?? "geral"] ?? setorTone.geral;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "cursor-move rounded-md border-2 px-2 py-1.5 text-xs transition-all hover:shadow-md",
        tone,
        conflict && "border-destructive ring-2 ring-destructive/40 animate-pulse",
        shift.status === "folga" && "opacity-50",
        shift.status === "falta" && "line-through",
      )}
      title={conflict ? "Conflito de horário!" : `${shift.shift_start.slice(0,5)}–${shift.shift_end.slice(0,5)} • ${shift.role_in_shift ?? ''}`}
    >
      <div className="font-semibold">{shift.shift_start.slice(0,5)}–{shift.shift_end.slice(0,5)}</div>
      {shift.role_in_shift && <div className="truncate text-[10px] opacity-80">{shift.role_in_shift}</div>}
    </div>
  );
}
