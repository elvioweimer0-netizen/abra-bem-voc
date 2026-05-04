import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { UnitsCompareRow } from "@/hooks/useSalesRange";

export function UnitsCompareChart({ data }: { data: UnitsCompareRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="unit_name" tick={{ fontSize: 11 }} width={120} />
        <Tooltip
          formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
