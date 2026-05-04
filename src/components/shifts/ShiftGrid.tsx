import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShiftCell } from "./ShiftCell";
import { useUnitTeam } from "@/hooks/useUnitTeam";
import type { Shift } from "@/hooks/useShifts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function ShiftGrid({ unitId, shifts, weekStart, days = 7, onCellClick }: {
  unitId: string;
  shifts: Shift[];
  weekStart: Date;
  days?: number;
  onCellClick?: (userId: string, date: string) => void;
}) {
  const { data: team = [] } = useUnitTeam(unitId);
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dragId, setDragId] = useState<string | null>(null);

  const dayList = useMemo(() => Array.from({ length: days }, (_, i) => addDays(weekStart, i)), [weekStart, days]);

  const conflicts = useMemo(() => {
    const set = new Set<string>();
    const byUserDate: Record<string, Shift[]> = {};
    for (const s of shifts) {
      const k = `${s.user_id}|${s.shift_date}`;
      (byUserDate[k] = byUserDate[k] ?? []).push(s);
    }
    for (const list of Object.values(byUserDate)) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          if (list[i].shift_start < list[j].shift_end && list[i].shift_end > list[j].shift_start) {
            set.add(list[i].id); set.add(list[j].id);
          }
        }
      }
    }
    return set;
  }, [shifts]);

  async function handleDrop(userId: string, date: string) {
    if (!dragId) return;
    const { error } = await (supabase as any).from("shifts").update({ user_id: userId, shift_date: date }).eq("id", dragId);
    if (error) toast({ title: "Erro ao mover", description: error.message, variant: "destructive" });
    else { toast({ title: "Turno movido" }); qc.invalidateQueries({ queryKey: ["shifts"] }); }
    setDragId(null);
  }

  if (team.length === 0) {
    return <p className="p-8 text-center text-muted-foreground">Nenhum colaborador na unidade.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid sticky top-0 z-10 bg-background border-b" style={{ gridTemplateColumns: `200px repeat(${days}, minmax(110px, 1fr))` }}>
          <div className="p-2 font-semibold text-sm">Colaborador</div>
          {dayList.map((d) => (
            <div key={d.toISOString()} className="p-2 text-center text-xs font-medium border-l">
              <div className="capitalize">{format(d, "EEE", { locale: ptBR })}</div>
              <div className="text-muted-foreground">{format(d, "dd/MM")}</div>
            </div>
          ))}
        </div>
        {team.map((m) => (
          <div key={m.user_id} className="grid border-b" style={{ gridTemplateColumns: `200px repeat(${days}, minmax(110px, 1fr))` }}>
            <div className="p-2 text-sm">
              <p className="font-medium truncate">{m.nome}</p>
              <p className="text-xs text-muted-foreground truncate">{m.cargo_titulo ?? m.cargo}</p>
            </div>
            {dayList.map((d) => {
              const dateStr = format(d, "yyyy-MM-dd");
              const cellShifts = shifts.filter((s) => s.user_id === m.user_id && s.shift_date === dateStr);
              return (
                <div
                  key={dateStr}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(m.user_id, dateStr)}
                  onClick={() => cellShifts.length === 0 && onCellClick?.(m.user_id, dateStr)}
                  className={cn("border-l p-1 space-y-1 min-h-[60px]", cellShifts.length === 0 && "cursor-pointer hover:bg-muted/30")}
                >
                  {cellShifts.map((s) => (
                    <ShiftCell key={s.id} shift={s} conflict={conflicts.has(s.id)} onDragStart={() => setDragId(s.id)} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
