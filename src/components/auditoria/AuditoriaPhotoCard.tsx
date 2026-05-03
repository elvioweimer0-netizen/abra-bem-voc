import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LazyPhoto } from "./LazyPhoto";
import type { AuditoriaRow } from "@/hooks/useAuditoriaVisual";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AuditoriaPhotoCard({
  row,
  onClick,
  small,
}: {
  row: AuditoriaRow;
  onClick?: () => void;
  small?: boolean;
}) {
  return (
    <Card
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden transition hover:shadow-md"
    >
      <LazyPhoto
        path={row.foto_url}
        alt={row.item_text}
        className={small ? "aspect-square" : "aspect-[4/3]"}
      />
      <Badge className="absolute left-2 top-2 bg-black/70 text-white hover:bg-black/70">
        {row.unit_code ?? row.unit_name ?? "—"}
      </Badge>
      <div className="flex items-center justify-between gap-2 p-2 text-xs">
        <span className="line-clamp-1 font-medium">{row.gestor_nome ?? "—"}</span>
        <span className="text-muted-foreground">
          {row.completed_at ? format(parseISO(row.completed_at), "dd/MM HH:mm", { locale: ptBR }) : "—"}
        </span>
      </div>
    </Card>
  );
}

export function EmptyUnitCard({ unitLabel }: { unitLabel: string }) {
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 text-muted-foreground">
      <Badge variant="outline" className="mb-2">{unitLabel}</Badge>
      <span className="text-xs">Sem foto registrada</span>
    </div>
  );
}
