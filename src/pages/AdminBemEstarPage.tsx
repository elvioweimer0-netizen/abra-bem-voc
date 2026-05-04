import { useMemo, useState } from "react";
import { useWellbeingAggregated } from "@/hooks/useWellbeing";
import { Card } from "@/components/ui/card";
import { Heart, AlertTriangle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

function useUnitsMap() {
  return useQuery({
    queryKey: ["units-map"],
    queryFn: async () => {
      const { data, error } = await supabase.from("units").select("id, name, code");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((u: any) => { map[u.id] = u.name ?? u.code ?? u.id; });
      return map;
    },
  });
}

export default function AdminBemEstarPage() {
  const [unitFilter, setUnitFilter] = useState<string | null>(null);
  const { data: rows, isLoading } = useWellbeingAggregated({ unit_id: unitFilter });
  const { data: unitsMap = {} } = useUnitsMap();

  const chartData = useMemo(() => {
    if (!rows) return [];
    return [...rows]
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((r) => ({
        month: r.month.slice(0, 7),
        unit: unitsMap[r.unit_id] ?? r.unit_id.slice(0, 6),
        score: Number(r.avg_composite_score),
        risco: Number(r.pct_alerta) + Number(r.pct_critico),
      }));
  }, [rows, unitsMap]);

  const alerts = useMemo(
    () => rows?.filter((r) => Number(r.pct_alerta) + Number(r.pct_critico) > 20) ?? [],
    [rows]
  );

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            Bem-estar — visão agregada
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Dados anônimos por unidade/mês. Mínimo 5 respostas pra exibir.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/bem-estar/criticos">Casos críticos</Link>
        </Button>
      </header>

      {alerts.length > 0 && (
        <Card className="p-4 border-destructive/50 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Atenção: alta proporção de risco</p>
              <p className="text-sm text-muted-foreground mt-1">
                {alerts.length} unidade(s)/mês com mais de 20% da equipe em alerta ou crítico.
              </p>
            </div>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !rows?.length ? (
        <Card className="p-8 text-center text-muted-foreground">
          Sem dados agregados ainda. Aguarde mais respostas.
        </Card>
      ) : (
        <>
          <Card className="p-5">
            <h2 className="font-semibold mb-4">Tendência do composite score</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" name="Score médio (↓ melhor)" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="risco" name="% em alerta+crítico" stroke="hsl(var(--destructive))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold mb-4">Distribuição por unidade/mês</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Unidade</th>
                    <th className="py-2 pr-4">Mês</th>
                    <th className="py-2 pr-4">N</th>
                    <th className="py-2 pr-4">Score</th>
                    <th className="py-2 pr-4">OK</th>
                    <th className="py-2 pr-4">Atenção</th>
                    <th className="py-2 pr-4">Alerta</th>
                    <th className="py-2 pr-4">Crítico</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2 pr-4">{unitsMap[r.unit_id] ?? r.unit_id.slice(0, 8)}</td>
                      <td className="py-2 pr-4">{r.month.slice(0, 7)}</td>
                      <td className="py-2 pr-4">{r.count_responses}</td>
                      <td className="py-2 pr-4 font-medium">{r.avg_composite_score}</td>
                      <td className="py-2 pr-4 text-green-600">{r.pct_ok}%</td>
                      <td className="py-2 pr-4 text-yellow-600">{r.pct_atencao}%</td>
                      <td className="py-2 pr-4 text-orange-600">{r.pct_alerta}%</td>
                      <td className="py-2 pr-4 text-destructive font-medium">{r.pct_critico}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
