import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { SalesRangeRow } from "@/hooks/useSalesRange";

export function SalesRangeChart({ data }: { data: SalesRangeRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="metric_date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        />
        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
