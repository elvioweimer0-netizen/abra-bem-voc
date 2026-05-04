import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { SafetyIncident } from "@/hooks/useSafetyIncidents";

type Props = {
  incidents: SafetyIncident[];
  unitsMap: Map<string, { code: string; name: string }>;
};

export function UnitsRankingChart({ incidents, unitsMap }: Props) {
  const counts = new Map<string, number>();
  incidents.forEach((i) => {
    counts.set(i.unit_id, (counts.get(i.unit_id) ?? 0) + 1);
  });
  const data = Array.from(counts.entries())
    .map(([uid, total]) => ({
      unit: unitsMap.get(uid)?.code ?? "—",
      total,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Ranking de unidades</CardTitle></CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="unit" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="total" fill="hsl(var(--destructive))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
