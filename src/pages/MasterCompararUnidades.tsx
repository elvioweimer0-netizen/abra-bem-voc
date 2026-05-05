import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Unit = { id: string; name: string };
type Kpi = "vendas" | "score" | "ocorrencias" | "incidentes" | "ruptura" | "presenca" | "humor" | "churn";
type Range = "hoje" | "semana" | "mes" | "trimestre" | "ano";

const KPI_OPTIONS: { value: Kpi; label: string }[] = [
  { value: "vendas", label: "Vendas (R$)" },
  { value: "score", label: "Score do gerente" },
  { value: "ocorrencias", label: "Ocorrências" },
  { value: "incidentes", label: "Incidentes graves" },
  { value: "ruptura", label: "Ruptura (produtos faltando)" },
  { value: "presenca", label: "Presença da equipe" },
  { value: "humor", label: "Humor médio" },
  { value: "churn", label: "Risco de churn" },
];

const RANGE_DAYS: Record<Range, number> = { hoje: 1, semana: 7, mes: 30, trimestre: 90, ano: 365 };
const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning))", "hsl(var(--success))", "#8b5cf6", "#06b6d4", "#f97316"];

function startDate(range: Range) {
  const d = new Date();
  d.setDate(d.getDate() - RANGE_DAYS[range] + 1);
  return d.toISOString().slice(0, 10);
}

export default function MasterCompararUnidades() {
  const { toast } = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [kpi, setKpi] = useState<Kpi>("vendas");
  const [range, setRange] = useState<Range>("semana");
  const [series, setSeries] = useState<Record<string, { date: string; value: number }[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("units").select("id, name").order("name");
      setUnits((data ?? []) as Unit[]);
    })();
  }, []);

  const toggleUnit = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  useEffect(() => {
    if (selected.length < 1) { setSeries({}); return; }
    setLoading(true);
    (async () => {
      const since = startDate(range);
      const out: Record<string, { date: string; value: number }[]> = {};

      for (const unitId of selected) {
        let rows: { date: string; value: number }[] = [];
        try {
          if (kpi === "vendas") {
            const { data } = await (supabase as any)
              .from("sales_metrics")
              .select("date, revenue")
              .eq("unit_id", unitId)
              .gte("date", since)
              .order("date");
            rows = (data ?? []).map((r: any) => ({ date: r.date, value: Number(r.revenue || 0) }));
          } else if (kpi === "score") {
            const { data } = await (supabase as any)
              .from("manager_scores_monthly")
              .select("month, final_score")
              .eq("unit_id", unitId)
              .gte("month", since)
              .order("month");
            rows = (data ?? []).map((r: any) => ({ date: r.month, value: Number(r.final_score || 0) }));
          } else if (kpi === "ocorrencias") {
            const { data } = await (supabase as any)
              .from("ocorrencias")
              .select("created_at")
              .eq("unit_id", unitId)
              .gte("created_at", since);
            const map: Record<string, number> = {};
            (data ?? []).forEach((r: any) => {
              const d = String(r.created_at).slice(0, 10);
              map[d] = (map[d] || 0) + 1;
            });
            rows = Object.entries(map).map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
          } else if (kpi === "incidentes") {
            const { data } = await (supabase as any)
              .from("safety_incidents")
              .select("created_at, severity")
              .eq("unit_id", unitId)
              .gte("created_at", since);
            const map: Record<string, number> = {};
            (data ?? []).filter((r: any) => r.severity === "muito_grave" || r.severity === "grave").forEach((r: any) => {
              const d = String(r.created_at).slice(0, 10);
              map[d] = (map[d] || 0) + 1;
            });
            rows = Object.entries(map).map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
          } else if (kpi === "ruptura") {
            const { data } = await (supabase as any)
              .from("missing_products")
              .select("created_at")
              .eq("unit_id", unitId)
              .gte("created_at", since);
            const map: Record<string, number> = {};
            (data ?? []).forEach((r: any) => {
              const d = String(r.created_at).slice(0, 10);
              map[d] = (map[d] || 0) + 1;
            });
            rows = Object.entries(map).map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
          } else {
            // Fallback: try master_snapshots
            const { data } = await (supabase as any)
              .from("master_snapshots")
              .select("snapshot_date, payload")
              .eq("unit_id", unitId)
              .gte("snapshot_date", since)
              .order("snapshot_date");
            rows = (data ?? []).map((r: any) => ({
              date: r.snapshot_date,
              value: Number(r.payload?.[kpi] ?? 0),
            }));
          }
        } catch {
          rows = [];
        }
        out[unitId] = rows;
      }
      setSeries(out);
      setLoading(false);
    })();
  }, [selected, kpi, range]);

  const chartData = useMemo(() => {
    const allDates = new Set<string>();
    Object.values(series).forEach((arr) => arr.forEach((p) => allDates.add(p.date)));
    const sorted = Array.from(allDates).sort();
    return sorted.map((date) => {
      const row: any = { date };
      selected.forEach((unitId) => {
        const u = units.find((x) => x.id === unitId);
        const point = series[unitId]?.find((p) => p.date === date);
        row[u?.name || unitId] = point?.value ?? null;
      });
      return row;
    });
  }, [series, selected, units]);

  const exportPdf = async () => {
    if (selected.length === 0) {
      toast({ title: "Selecione ao menos uma unidade", variant: "destructive" });
      return;
    }
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default as any;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Comparação de unidades", 14, 18);
    doc.setFontSize(10);
    doc.text(`KPI: ${KPI_OPTIONS.find((k) => k.value === kpi)?.label} | Período: ${range}`, 14, 26);
    const head = ["Data", ...selected.map((id) => units.find((u) => u.id === id)?.name || id)];
    const body = chartData.map((row) => [row.date, ...selected.map((id) => {
      const name = units.find((u) => u.id === id)?.name || id;
      const v = row[name];
      return v == null ? "—" : String(v);
    })]);
    autoTable(doc, { head: [head], body, startY: 32, styles: { fontSize: 8 } });
    doc.save(`comparacao-unidades-${kpi}-${range}.pdf`);
    toast({ title: "PDF gerado" });
  };

  return (
    <div className="space-y-4 pb-20">
      <Card className="rounded-xl">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div>
            <h1 className="text-xl font-bold">Comparar unidades</h1>
            <p className="text-sm text-muted-foreground">Selecione 2 ou mais unidades, escolha um KPI e um período.</p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Unidades</p>
            <div className="flex flex-wrap gap-2">
              {units.map((u) => {
                const on = selected.includes(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleUnit(u.id)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      on ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"
                    }`}
                  >
                    {u.name}
                    {on && <X className="inline h-3 w-3 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">KPI</p>
              <Select value={kpi} onValueChange={(v) => setKpi(v as Kpi)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KPI_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Período</p>
              <Select value={range} onValueChange={(v) => setRange(v as Range)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Última semana</SelectItem>
                  <SelectItem value="mes">Último mês</SelectItem>
                  <SelectItem value="trimestre">Último trimestre</SelectItem>
                  <SelectItem value="ano">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={exportPdf} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" /> Exportar PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="p-4 sm:p-6">
          {selected.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              Selecione ao menos uma unidade acima.
            </p>
          ) : loading ? (
            <p className="text-center text-sm text-muted-foreground py-12">Carregando…</p>
          ) : chartData.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">Sem dados para o período.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{selected.length} unidade(s)</Badge>
                <Badge variant="outline">{KPI_OPTIONS.find((k) => k.value === kpi)?.label}</Badge>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  {selected.map((id, i) => {
                    const name = units.find((u) => u.id === id)?.name || id;
                    return <Line key={id} type="monotone" dataKey={name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />;
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
