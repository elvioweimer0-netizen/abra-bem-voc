import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Package } from "lucide-react";
import type { MissingProduct, MissingProductStatus } from "@/hooks/useMissingProducts";
import { AdminStatusSelect } from "./AdminStatusSelect";

const STATUS_TONE: Record<MissingProductStatus, string> = {
  aberto: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40",
  em_compras: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40",
  adicionado: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
  recusado: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABEL: Record<MissingProductStatus, string> = {
  aberto: "Aberto",
  em_compras: "Em compras",
  adicionado: "Adicionado",
  recusado: "Recusado",
};

export function MissingProductCard({
  item,
  voted,
  onToggleVote,
  showAdminControls = false,
  voteDisabled = false,
}: {
  item: MissingProduct;
  voted: boolean;
  onToggleVote: () => void;
  showAdminControls?: boolean;
  voteDisabled?: boolean;
}) {
  const date = new Date(item.created_at).toLocaleDateString("pt-BR");
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
            <h3 className="font-semibold truncate">{item.product_name}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {item.brand && <span>{item.brand} · </span>}
            {item.category && <span>{item.category.replace(/_/g, " ")} · </span>}
            <span>{item.unit?.code || "—"}</span>
          </p>
          {item.notes && <p className="text-xs text-foreground/80 mt-1">{item.notes}</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge variant="outline" className={STATUS_TONE[item.status]}>
            {STATUS_LABEL[item.status]}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{date}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{item.customer_count}</span>
          <span>cliente(s) pediram</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={voted ? "secondary" : "default"}
            onClick={onToggleVote}
            disabled={voteDisabled}
            className="gap-1"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            {voted ? "Eu também ✓" : "Eu também"}
          </Button>
        </div>
      </div>

      {showAdminControls && (
        <div className="border-t pt-3">
          <AdminStatusSelect id={item.id} status={item.status} />
        </div>
      )}
    </Card>
  );
}
