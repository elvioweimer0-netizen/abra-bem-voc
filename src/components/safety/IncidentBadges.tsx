import { Badge } from "@/components/ui/badge";
import type { IncidentSeverity, IncidentStatus, IncidentType } from "@/hooks/useSafetyIncidents";

const TYPE_LABEL: Record<IncidentType, string> = {
  queda: "Queda", corte: "Corte", queimadura: "Queimadura",
  choque_eletrico: "Choque elétrico", quase_acidente: "Quase-acidente",
  exposicao_quimica: "Exposição química", assalto: "Assalto", outro: "Outro",
};

const SEV_LABEL: Record<IncidentSeverity, string> = {
  quase_acidente: "Quase-acidente", leve: "Leve", moderado: "Moderado",
  grave: "Grave", muito_grave: "Muito grave",
};

const STATUS_LABEL: Record<IncidentStatus, string> = {
  aberto: "Aberto", investigando: "Investigando",
  corrigido: "Corrigido", arquivado: "Arquivado",
};

export function TypeBadge({ value }: { value: IncidentType }) {
  return <Badge variant="outline">{TYPE_LABEL[value]}</Badge>;
}

export function SeverityBadge({ value }: { value: IncidentSeverity }) {
  const variant = value === "muito_grave" || value === "grave"
    ? "destructive" : value === "quase_acidente" ? "secondary" : "default";
  return <Badge variant={variant as any}>{SEV_LABEL[value]}</Badge>;
}

export function StatusBadge({ value }: { value: IncidentStatus }) {
  const variant = value === "aberto" ? "destructive"
    : value === "corrigido" ? "default"
    : value === "arquivado" ? "outline" : "secondary";
  return <Badge variant={variant as any}>{STATUS_LABEL[value]}</Badge>;
}

export { TYPE_LABEL, SEV_LABEL, STATUS_LABEL };
