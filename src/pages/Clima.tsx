import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { useClimateAccess } from "@/hooks/useClimateAccess";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle } from "lucide-react";

export default function Clima() {
  const { canViewClima } = useClimateAccess();
  const { data: units = [] } = useAccessibleUnits();
  const [unitId, setUnitId] = useState<string>("all");

  if (!canViewClima) return <Navigate to="/" replace />;

  const since = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const { data: mood = [] } = useQuery({
    queryKey: ["mood-agg", unitId, since],
    queryFn: async () => {
      let q = supabase.from("v_mood_aggregate").select("unit_id, day, avg_score, responses").gte("day", since).order("day");
      if (unitId !== "all") q = q.eq("unit_id", unitId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: pulse = [] } = useQuery({
    queryKey: ["pulse-agg", unitId],
    queryFn: async () => {
      let q = supabase.from("v_pulse_aggregate").select("question_id, week_start_date, question_text, unit_id, answer_text, answered_at").order("answered_at", { ascending: false }).limit(200);
      if (unitId !== "all") q = q.eq("unit_id", unitId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // Agregar por dia (média entre unidades quando "all")
  const chartData = useMemo(() => {
    const byDay = new Map<string, { day: string; total: number; n: number }>();
    for (const r of mood) {
      const cur = byDay.get(r.day) ?? { day: r.day, total: 0, n: 0 };
      cur.total += Number(r.avg_score) * Number(r.responses);
      cur.n += Number(r.responses);
      byDay.set(r.day, cur);
    }
    return Array.from(byDay.values()).map((x) => ({ day: x.day.slice(5), avg: +(x.total / Math.max(x.n, 1)).toFixed(2) }));
  }, [mood]);

  // Alerta: 2+ dias consecutivos com avg < 3
  const alert = useMemo(() => {
    let streak = 0, best = 0;
    for (const p of chartData) {
      if (p.avg < 3) { streak++; best = Math.max(best, streak); } else streak = 0;
    }
    return best >= 2;
  }, [chartData]);

  const unitsById = useMemo(() => Object.fromEntries(units.map((u: any) => [u.id, u.name])), [units]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clima Organizacional</h1>
          <p className="text-sm text-muted-foreground">Humorômetro diário e Pulso semanal anônimos</p>
        </div>
        <Select value={unitId} onValueChange={setUnitId}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as unidades</SelectItem>
            {units.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {alert && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Atenção: humor médio abaixo de 3 em 2+ dias consecutivos.
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Humorômetro — últimos 30 dias</CardTitle></CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Pulso da Semana — respostas anônimas</CardTitle></CardHeader>
        <CardContent>
          {pulse.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem respostas ainda.</p>
          ) : (
            <div className="space-y-3">
              {pulse.map((p, i) => (
                <div key={i} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Badge variant="outline">{unitsById[p.unit_id] ?? "—"}</Badge>
                    <span>Semana de {new Date(p.week_start_date).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <p className="mt-1 text-xs italic text-muted-foreground">{p.question_text}</p>
                  <p className="mt-2 text-sm">{p.answer_text}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
