import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useMysteryVisits, type MysteryVisit } from "@/hooks/useMysteryVisits";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { MysteryVisitCard } from "@/components/mystery/MysteryVisitCard";
import { MysteryVisitDetail } from "@/components/mystery/MysteryVisitDetail";
import { useRole } from "@/hooks/useRole";
import { History } from "lucide-react";

export default function MysteryHistoricoPage() {
  const { isAdmin, isSupervisor } = useRole();
  const isManager = isAdmin || isSupervisor;
  const { data: units = [] } = useAccessibleUnits();
  const [unitId, setUnitId] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [selected, setSelected] = useState<MysteryVisit | null>(null);

  const { data: visits = [], isLoading } = useMysteryVisits({
    unitId: unitId || null,
    from: from || null,
    to: to || null,
  });

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Histórico de visitas</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Filtre por unidade ou período.</p>
      </div>

      <Card className="p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Unidade</Label>
            <Select value={unitId || "all"} onValueChange={(v) => setUnitId(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.code} — {u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">De</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : visits.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma visita encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <MysteryVisitCard
              key={v.id}
              visit={v}
              onOpen={() => setSelected(v)}
              showVisitor={isManager}
            />
          ))}
        </div>
      )}

      <MysteryVisitDetail visit={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />
    </div>
  );
}
