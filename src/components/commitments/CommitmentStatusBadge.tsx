import { Badge } from "@/components/ui/badge";
import type { CommitmentStatus } from "@/hooks/useWeeklyCommitments";

const LABELS: Record<CommitmentStatus, string> = {
  em_andamento: "Em andamento",
  cumprido: "Cumprido",
  parcial: "Parcial",
  nao_cumprido: "Não cumprido",
  cancelado: "Cancelado",
};

const CLS: Record<CommitmentStatus, string> = {
  em_andamento: "bg-primary/15 text-primary border-primary/30",
  cumprido: "bg-success/15 text-success border-success/40",
  parcial: "bg-warning/15 text-warning-foreground border-warning/40",
  nao_cumprido: "bg-destructive/15 text-destructive border-destructive/40",
  cancelado: "bg-muted text-muted-foreground border-border",
};

export function CommitmentStatusBadge({ status }: { status: CommitmentStatus }) {
  return <Badge variant="outline" className={CLS[status]}>{LABELS[status]}</Badge>;
}

export const STATUS_OPTIONS: { value: CommitmentStatus; label: string }[] = [
  { value: "cumprido", label: "Cumprido" },
  { value: "parcial", label: "Parcial" },
  { value: "nao_cumprido", label: "Não cumprido" },
  { value: "cancelado", label: "Cancelado" },
];
