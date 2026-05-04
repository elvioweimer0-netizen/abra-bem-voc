import { useMemo, useState } from "react";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { useComplaints, type Complaint, type ComplaintCategory, type ComplaintSeverity, type ComplaintStatus } from "@/hooks/useComplaints";
import { useComplaintTrends } from "@/hooks/useComplaintTrends";
import { ComplaintCard } from "@/components/complaints/ComplaintCard";
import { ComplaintFilters } from "@/components/complaints/ComplaintFilters";
import { ComplaintDetailDialog } from "@/components/complaints/ComplaintDetailDialog";
import { ComplaintTrendsChart } from "@/components/complaints/ComplaintTrendsChart";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircleWarning } from "lucide-react";

export default function AdminReclamacoesPage() {
  const { data: units = [] } = useAccessibleUnits();
  const trends = useComplaintTrends(30);
  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [severity, setSeverity] = useState<ComplaintSeverity | null>(null);
  const [status, setStatus] = useState<ComplaintStatus | null>(null);
  const [selected, setSelected] = useState<Complaint | null>(null);

  const { data: complaints = [], isLoading } = useComplaints({ category, severity, status });

  const unitName = useMemo(() => {
    const m = new Map(units.map((u) => [u.id, u]));
    return (id: string) => m.get(id);
  }, [units]);

  const ranking = useMemo(() => {
    return (trends.data?.byUnit ?? []).map((r) => ({
      ...r,
      unit: unitName(r.unit_id),
    })).filter((r) => r.unit).slice(0, 10);
  }, [trends.data, unitName]);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-2">
        <MessageCircleWarning className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Reclamações (consolidado)</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Visão consolidada de reclamações de cliente em todas as unidades.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold">{trends.data?.total ?? 0}</div><div className="text-[11px] text-muted-foreground">Total 30d</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{trends.data?.unresolved ?? 0}</div><div className="text-[11px] text-muted-foreground">Não resolvidas</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold">{ranking.length}</div><div className="text-[11px] text-muted-foreground">Unidades afetadas</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-destructive">
          {(trends.data ? Object.entries(trends.data.byCategory).sort((a,b)=>b[1]-a[1])[0]?.[1] : 0) || 0}
        </div><div className="text-[11px] text-muted-foreground">Categoria + recorrente</div></CardContent></Card>
      </div>

      {trends.data && <ComplaintTrendsChart trends={trends.data} />}

      <Card>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-foreground">Ranking por unidade (30d)</h3>
          {ranking.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem dados.</p>
          ) : ranking.map((r, idx) => (
            <div key={r.unit_id} className="flex items-center justify-between border-b border-border/70 py-2 last:border-0">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <span className="text-muted-foreground text-xs w-5">#{idx+1}</span>
                <span className="font-medium">{r.unit?.code}</span>
                <span className="text-muted-foreground text-xs">{r.unit?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{r.total} total</Badge>
                {r.unresolved > 0 && <Badge variant="destructive">{r.unresolved} abertas</Badge>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">Todas as reclamações</h3>
        <ComplaintFilters
          category={category}
          severity={severity}
          status={status}
          onChange={(n) => { setCategory(n.category); setSeverity(n.severity); setStatus(n.status); }}
        />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : complaints.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhuma reclamação.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {complaints.slice(0, 100).map((c) => (
              <ComplaintCard key={c.id} complaint={c} onClick={() => setSelected(c)} />
            ))}
          </div>
        )}
      </div>

      <ComplaintDetailDialog
        complaint={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </div>
  );
}
