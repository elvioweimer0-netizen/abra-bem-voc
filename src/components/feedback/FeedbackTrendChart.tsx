import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { AggregatedRow, FeedbackCycle } from "@/hooks/useManagerFeedback";

interface Props { rows: AggregatedRow[]; cycles: FeedbackCycle[] }

export function FeedbackTrendChart({ rows, cycles }: Props) {
  const cycleMap = new Map(cycles.map((c) => [c.id, `${c.year}T${c.quarter}`]));
  // pivot: cycle -> { question_code -> avg }
  const data: Record<string, any> = {};
  for (const r of rows) {
    const key = cycleMap.get(r.cycle_id) ?? r.cycle_id.slice(0, 6);
    data[key] = data[key] ?? { name: key };
    data[key][r.question_code] = Number(r.avg_score);
  }
  const chartData = Object.values(data).sort((a: any, b: any) => a.name.localeCompare(b.name));
  const codes = [...new Set(rows.map((r) => r.question_code))];
  const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

  if (chartData.length === 0) return <p className="text-sm text-muted-foreground">Sem dados suficientes ainda.</p>;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis domain={[1, 5]} />
          <Tooltip />
          <Legend />
          {codes.map((c, i) => (
            <Line key={c} type="monotone" dataKey={c} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
