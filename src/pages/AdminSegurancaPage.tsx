import { useMemo, useState } from "react";
import { useSafetyIncidents, type IncidentSeverity, type IncidentStatus, type IncidentType } from "@/hooks/useSafetyIncidents";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { SafetyFilters } from "@/components/safety/SafetyFilters";
import { IncidentList } from "@/components/safety/IncidentList";
import { IncidentDetailDialog } from "@/components/safety/IncidentDetailDialog";
import { SafetyTrendsChart } from "@/components/safety/SafetyTrendsChart";
import { UnitsRankingChart } from "@/components/safety/UnitsRankingChart";
import { ExportNRReportButton } from "@/components/safety/ExportNRReportButton";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function AdminSegurancaPage() {
  const { data: units = [] } = useAccessibleUnits();
  const [type, setType] = useState<IncidentType | null>(null);
  const [severity, setSeverity] = useState<IncidentSeverity | null>(null);
  const [status, setStatus] = useState<IncidentStatus | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const { data: incidents = [], isLoading } = useSafetyIncidents({
    incident_type: type, severity, status,
  });

  const unitsMap = useMemo(
    () => new Map(units.map((u) => [u.id, { code: u.code, name: u.name }])),
    [units]
  );

  const stats = useMemo(() => ({
    total: incidents.length,
    open: incidents.filter((i) => i.status === "aberto").length,
    severe: incidents.filter((i) => i.severity === "grave" || i.severity === "muito_grave").length,
    nearMiss: incidents.filter((i) => i.severity === "quase_acidente").length,
  }), [incidents]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" /> Segurança · Consolidado da Rede
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão de todas as unidades acessíveis para análise e compliance.
          </p>
        </div>
        <ExportNRReportButton incidents={incidents} unitsMap={unitsMap} scopeLabel="Rede" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Abertos</p><p className="text-2xl font-bold">{stats.open}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Graves+</p><p className="text-2xl font-bold text-destructive">{stats.severe}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Quase-acidentes</p><p className="text-2xl font-bold">{stats.nearMiss}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SafetyTrendsChart incidents={incidents} />
        <UnitsRankingChart incidents={incidents} unitsMap={unitsMap} />
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
