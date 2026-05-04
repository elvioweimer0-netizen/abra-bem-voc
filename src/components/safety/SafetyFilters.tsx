import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { IncidentSeverity, IncidentStatus, IncidentType } from "@/hooks/useSafetyIncidents";

type Props = {
  type: IncidentType | null;
  severity: IncidentSeverity | null;
  status: IncidentStatus | null;
  onChange: (patch: { type?: IncidentType | null; severity?: IncidentSeverity | null; status?: IncidentStatus | null }) => void;
};

export function SafetyFilters({ type, severity, status, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select value={type ?? "all"} onValueChange={(v) => onChange({ type: v === "all" ? null : (v as IncidentType) })}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          <SelectItem value="quase_acidente">Quase-acidente</SelectItem>
          <SelectItem value="queda">Queda</SelectItem>
          <SelectItem value="corte">Corte</SelectItem>
          <SelectItem value="queimadura">Queimadura</SelectItem>
          <SelectItem value="choque_eletrico">Choque elétrico</SelectItem>
          <SelectItem value="exposicao_quimica">Exposição química</SelectItem>
          <SelectItem value="assalto">Assalto</SelectItem>
          <SelectItem value="outro">Outro</SelectItem>
        </SelectContent>
      </Select>

      <Select value={severity ?? "all"} onValueChange={(v) => onChange({ severity: v === "all" ? null : (v as IncidentSeverity) })}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Gravidade" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas gravidades</SelectItem>
          <SelectItem value="quase_acidente">Quase-acidente</SelectItem>
          <SelectItem value="leve">Leve</SelectItem>
          <SelectItem value="moderado">Moderado</SelectItem>
          <SelectItem value="grave">Grave</SelectItem>
          <SelectItem value="muito_grave">Muito grave</SelectItem>
        </SelectContent>
      </Select>

      <Select value={status ?? "all"} onValueChange={(v) => onChange({ status: v === "all" ? null : (v as IncidentStatus) })}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos status</SelectItem>
          <SelectItem value="aberto">Aberto</SelectItem>
          <SelectItem value="investigando">Investigando</SelectItem>
          <SelectItem value="corrigido">Corrigido</SelectItem>
          <SelectItem value="arquivado">Arquivado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
