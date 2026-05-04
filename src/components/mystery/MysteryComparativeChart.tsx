import { Card } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import type { UnitStat, CriterionTrend } from "@/hooks/useMysteryComparativeStats";

export function MysteryComparativeChart({
  units,
  criteria,
}: { units: UnitStat[]; criteria: CriterionTrend[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Score médio por unidade</h3>
        {units.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">Sem dados ainda.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={units.map((u) => ({ name: u.unit_code || "—", score: u.avg_score, visits: u.visits }))}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Média por critério (1-5)</h3>
        {criteria.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">Sem dados ainda.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={criteria.map((c) => ({ name: c.criterion_name, value: c.avg_score }))}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
              <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
