import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { ComplaintTrends } from "@/hooks/useComplaintTrends";

const LABELS: Record<string, string> = {
  atendimento: "Atendimento", produto: "Produto", preco: "Preço",
  fila: "Fila", limpeza: "Limpeza", estoque: "Estoque", outros: "Outros",
};

export function ComplaintTrendsChart({ trends }: { trends: ComplaintTrends }) {
  const data = Object.entries(trends.byCategory).map(([k, v]) => ({
    category: LABELS[k] ?? k,
    total: v,
  }));

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground mb-3">Reclamações por categoria (últimos 30 dias)</h3>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
