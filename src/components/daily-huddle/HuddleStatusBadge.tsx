import { Badge } from "@/components/ui/badge";
import type { MetaStatus } from "@/hooks/useDailyHuddle";

const META_LABEL: Record<MetaStatus, string> = {
  no_caminho: "No caminho",
  em_risco: "Em risco",
  atingida: "Atingida",
  nao_atingida: "Não atingida",
};

const META_CLS: Record<MetaStatus, string> = {
  no_caminho: "bg-primary/15 text-primary border-primary/30",
  em_risco: "bg-warning/15 text-warning-foreground border-warning/40",
  atingida: "bg-success/15 text-success border-success/40",
  nao_atingida: "bg-destructive/15 text-destructive border-destructive/40",
};

export function HuddleStatusBadge({ status }: { status: MetaStatus }) {
  return (
    <Badge variant="outline" className={META_CLS[status]}>
      {META_LABEL[status]}
    </Badge>
  );
}

export const META_OPTIONS: { value: MetaStatus; label: string }[] = [
  { value: "no_caminho", label: "No caminho" },
  { value: "em_risco", label: "Em risco" },
  { value: "atingida", label: "Atingida" },
  { value: "nao_atingida", label: "Não atingida" },
];
