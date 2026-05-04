import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { SafetyIncident } from "@/hooks/useSafetyIncidents";
import { TYPE_LABEL } from "./IncidentBadges";

export function SafetyTrendsChart({ incidents }: { incidents: SafetyIncident[] }) {
  const counts = new Map<string, number>();
  incidents.forEach((i) => {
    counts.set(i.incident_type, (counts.get(i.incident_type) ?? 0) + 1);
  });
  const data = Array.from(counts.entries()).map(([k, v]) => ({
    type: TYPE_LABEL[k as keyof typeof TYPE_LABEL] ?? k,
    total: v,
  }));

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Tendências por tipo</CardTitle></CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="total" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
