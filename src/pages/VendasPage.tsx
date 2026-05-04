import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useSalesRange, useSalesCompareUnits } from "@/hooks/useSalesRange";
import { useSalesToday } from "@/hooks/useSalesToday";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LancarVendaDialog } from "@/components/sales/LancarVendaDialog";
import { SalesRangeChart } from "@/components/sales/SalesRangeChart";
import { UnitsCompareChart } from "@/components/sales/UnitsCompareChart";
import { TrendingUp } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function VendasPage() {
  const { profile } = useAuth();
  const { isAdmin, isSupervisor, cargo } = useRole();
  const unitId = profile?.unit_id ?? undefined;
  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);
  const [tab, setTab] = useState("semana");

  const range = useMemo(() => {
    const to = isoToday;
    const d = new Date();
    if (tab === "dia") d.setDate(d.getDate() - 1);
    else if (tab === "semana") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 30);
    return { from: d.toISOString().slice(0, 10), to };
  }, [tab, isoToday]);

  const { data: rangeData = [] } = useSalesRange(unitId, range.from, range.to);
  const { data: summary } = useSalesToday(unitId);
  const { data: compare = [] } = useSalesCompareUnits(range.from, range.to, isAdmin || isSupervisor || cargo === "master");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6 text-primary" /> Vendas</h1>
          <p className="text-sm text-muted-foreground">Acompanhe meta diária, semanal e mensal · atualiza a cada 5 min</p>
        </div>
        {unitId && <LancarVendaDialog unitId={unitId} />}
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Hoje</div><div className="text-xl font-bold">{fmt(summary.revenue_today)}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Meta diária</div><div className="text-xl font-bold">{fmt(summary.target_daily)}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Ontem</div><div className="text-xl font-bold">{fmt(summary.revenue_yesterday)}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Meta do mês</div><div className="text-xl font-bold">{fmt(summary.target_month_revenue)}</div></CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="dia">24h</TabsTrigger>
              <TabsTrigger value="semana">7 dias</TabsTrigger>
              <TabsTrigger value="mes">30 dias</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="pt-4">
              {rangeData.length ? <SalesRangeChart data={rangeData} /> : <p className="text-sm text-muted-foreground py-8 text-center">Sem dados no período.</p>}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {(isAdmin || isSupervisor || cargo === "master") && compare.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Comparativo entre unidades · {tab === "dia" ? "24h" : tab === "semana" ? "7 dias" : "30 dias"}</CardTitle></CardHeader>
          <CardContent><UnitsCompareChart data={compare} /></CardContent>
        </Card>
      )}
    </div>
  );
}
