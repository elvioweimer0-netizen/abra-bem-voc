import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addDays, format, startOfWeek } from "date-fns";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function EscalaAdminPage() {
  const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
  const from = format(ws, "yyyy-MM-dd");
  const to = format(addDays(ws, 6), "yyyy-MM-dd");

  const { data: units = [] } = useQuery({
    queryKey: ["units-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("units").select("id, code, name, type").order("code");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allShifts = [] } = useQuery({
    queryKey: ["shifts-week-all", from, to],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("shifts")
        .select("id, unit_id, user_id, shift_date, shift_start, shift_end, status")
        .gte("shift_date", from).lte("shift_date", to);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pendingSwaps = [] } = useQuery({
    queryKey: ["pending-swaps-all"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("shift_swaps")
        .select("id, original_shift_id, status, shifts:original_shift_id(unit_id)")
        .in("status", ["aberto"]);
      if (error) throw error;
      return data ?? [];
    },
  });

  const byUnit = useMemo(() => {
    const map: Record<string, { count: number; people: Set<string>; hours: number }> = {};
    for (const s of allShifts as any[]) {
      const m = (map[s.unit_id] = map[s.unit_id] ?? { count: 0, people: new Set(), hours: 0 });
      m.count++;
      m.people.add(s.user_id);
      const sh = parseInt(s.shift_start.slice(0, 2), 10);
      const eh = parseInt(s.shift_end.slice(0, 2), 10);
      m.hours += (eh === 0 ? 24 : eh) - sh;
    }
    return map;
  }, [allShifts]);

  const swapsByUnit = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of pendingSwaps as any[]) {
      const uid = s.shifts?.unit_id;
      if (uid) m[uid] = (m[uid] ?? 0) + 1;
    }
    return m;
  }, [pendingSwaps]);

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4">
        <h1 className="text-xl font-bold">Escala — Visão Admin</h1>
        <p className="text-sm text-muted-foreground">Semana de {format(ws, "dd/MM")} a {format(addDays(ws, 6), "dd/MM")}</p>
      </CardContent></Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((u: any) => {
          const stats = byUnit[u.id] ?? { count: 0, people: new Set(), hours: 0 };
          const swaps = swapsByUnit[u.id] ?? 0;
          return (
            <Card key={u.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{u.name}</h2>
                  <Badge variant="outline">{u.code}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-2xl font-bold text-primary">{stats.count}</p><p className="text-xs text-muted-foreground">Turnos</p></div>
                  <div><p className="text-2xl font-bold text-primary">{stats.people.size}</p><p className="text-xs text-muted-foreground">Pessoas</p></div>
                  <div><p className="text-2xl font-bold text-primary">{stats.hours}h</p><p className="text-xs text-muted-foreground">Total</p></div>
                </div>
                {swaps > 0 && <Badge variant="destructive">{swaps} troca{swaps > 1 ? "s" : ""} pendente{swaps > 1 ? "s" : ""}</Badge>}
                <Link to={`/escala?unit=${u.id}`} className="flex items-center justify-end text-sm text-primary hover:underline">
                  Abrir grade <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
