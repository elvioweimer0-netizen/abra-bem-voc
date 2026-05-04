import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMysteryComparativeStats } from "@/hooks/useMysteryComparativeStats";
import { MysteryComparativeChart } from "@/components/mystery/MysteryComparativeChart";
import { Trophy, BarChart3 } from "lucide-react";

const PERIOD_OPTIONS: { id: string; label: string; days: number | null }[] = [
  { id: "30d", label: "30 dias", days: 30 },
  { id: "90d", label: "90 dias", days: 90 },
  { id: "ytd", label: "Tudo", days: null },
];

export default function AdminMysteryPage() {
  const [period, setPeriod] = useState("30d");
  const opt = PERIOD_OPTIONS.find((p) => p.id === period)!;
  const from = opt.days ? new Date(Date.now() - opt.days * 86400 * 1000).toISOString().slice(0, 10) : null;

  const { data, isLoading } = useMysteryComparativeStats({ from });

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Cliente Misterioso — Visão geral</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Comparativo entre unidades e tendências por critério.</p>
      </div>

      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList>
          {PERIOD_OPTIONS.map((p) => <TabsTrigger key={p.id} value={p.id}>{p.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <>
          <MysteryComparativeChart units={data?.units ?? []} criteria={data?.criteria ?? []} />

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Ranking de unidades
            </h3>
            {(data?.units ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Sem visitas no período.</p>
            ) : (
              <div className="space-y-2">
                {(data?.units ?? []).map((u, i) => (
                  <div key={u.unit_id} className="flex items-center justify-between rounded border p-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">{i + 1}º</span>
                      <div>
                        <p className="text-sm font-medium">{u.unit_code} — {u.unit_name}</p>
                        <p className="text-[10px] text-muted-foreground">{u.visits} visita(s)</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold">{u.avg_score.toFixed(1)}/10</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
