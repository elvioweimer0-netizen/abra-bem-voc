import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSafetyIncidents, type IncidentSeverity, type IncidentStatus, type IncidentType } from "@/hooks/useSafetyIncidents";
import { SafetyFilters } from "@/components/safety/SafetyFilters";
import { IncidentList } from "@/components/safety/IncidentList";
import { IncidentDetailDialog } from "@/components/safety/IncidentDetailDialog";
import { ReportIncidentDialog } from "@/components/safety/ReportIncidentDialog";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function SegurancaPage() {
  const { profile } = useAuth();
  const unitId = (profile as any)?.unit_id as string | undefined;
  const [type, setType] = useState<IncidentType | null>(null);
  const [severity, setSeverity] = useState<IncidentSeverity | null>(null);
  const [status, setStatus] = useState<IncidentStatus | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const { data: incidents = [], isLoading } = useSafetyIncidents({
    unit_id: unitId,
    incident_type: type,
    severity,
    status,
  });

  const stats = useMemo(() => {
    return {
      total: incidents.length,
      open: incidents.filter((i) => i.status === "aberto").length,
      severe: incidents.filter((i) => i.severity === "grave" || i.severity === "muito_grave").length,
      nearMiss: incidents.filter((i) => i.severity === "quase_acidente").length,
    };
  }, [incidents]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" /> Segurança da Unidade
          </h1>
          <p className="text-sm text-muted-foreground">
            Registros de incidentes e quase-acidentes. Quase-acidentes são prevenção 🛡️
          </p>
        </div>
        <ReportIncidentDialog defaultUnitId={unitId} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Abertos</p><p className="text-2xl font-bold">{stats.open}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Graves+</p><p className="text-2xl font-bold text-destructive">{stats.severe}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Quase-acidentes</p><p className="text-2xl font-bold">{stats.nearMiss}</p></CardContent></Card>
      </div>

      <SafetyFilters
        type={type} severity={severity} status={status}
        onChange={(p) => {
          if (p.type !== undefined) setType(p.type);
          if (p.severity !== undefined) setSeverity(p.severity);
          if (p.status !== undefined) setStatus(p.status);
        }}
      />

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p>
        : <IncidentList incidents={incidents} onSelect={setSelected} />}

      <IncidentDetailDialog incidentId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
