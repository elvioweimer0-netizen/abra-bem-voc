import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { useComplaints, type Complaint, type ComplaintCategory, type ComplaintSeverity, type ComplaintStatus } from "@/hooks/useComplaints";
import { ComplaintCard } from "@/components/complaints/ComplaintCard";
import { ComplaintFilters } from "@/components/complaints/ComplaintFilters";
import { ComplaintDetailDialog } from "@/components/complaints/ComplaintDetailDialog";
import { ComplaintTriggerButton } from "@/components/complaints/ComplaintTriggerButton";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircleWarning } from "lucide-react";

const ALL = "_all";

export default function ReclamacoesPage() {
  const [params] = useSearchParams();
  const queryUnit = params.get("unit");
  const { profile } = useAuth();
  const { data: units = [] } = useAccessibleUnits();

  const initialUnit = queryUnit || (profile as any)?.unit_id || (units[0]?.id ?? "");
  const [unitId, setUnitId] = useState<string>(initialUnit);
  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [severity, setSeverity] = useState<ComplaintSeverity | null>(null);
  const [status, setStatus] = useState<ComplaintStatus | null>(null);
  const [selected, setSelected] = useState<Complaint | null>(null);

  const { data: complaints = [], isLoading } = useComplaints({
    unitId: unitId || null, category, severity, status,
  });

  const summary = useMemo(() => ({
    total: complaints.length,
    abertas: complaints.filter((c) => c.status !== "resolvida").length,
    graves: complaints.filter((c) => c.severity === "grave" || c.severity === "muito_grave").length,
  }), [complaints]);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-2">
        <MessageCircleWarning className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Reclamações de cliente</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Reclamações registradas pela equipe da unidade.
      </p>

      <ComplaintTriggerButton variant="default" />

      <div className="grid grid-cols-3 gap-2">
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold">{summary.total}</div><div className="text-[11px] text-muted-foreground">No filtro</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{summary.abertas}</div><div className="text-[11px] text-muted-foreground">Não resolvidas</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-destructive">{summary.graves}</div><div className="text-[11px] text-muted-foreground">Graves</div></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {units.length > 1 && (
          <Select value={unitId || ALL} onValueChange={(v) => setUnitId(v === ALL ? "" : v)}>
            <SelectTrigger className="w-[180px] h-9 text-xs"><SelectValue placeholder="Unidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas unidades</SelectItem>
              {units.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <ComplaintFilters
          category={category}
          severity={severity}
          status={status}
          onChange={(n) => { setCategory(n.category); setSeverity(n.severity); setStatus(n.status); }}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : complaints.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhuma reclamação encontrada.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {complaints.map((c) => (
            <ComplaintCard key={c.id} complaint={c} onClick={() => setSelected(c)} />
          ))}
        </div>
      )}

      <ComplaintDetailDialog
        complaint={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </div>
  );
}
