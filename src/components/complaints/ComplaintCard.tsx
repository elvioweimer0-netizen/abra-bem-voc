import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircleWarning } from "lucide-react";
import type { Complaint } from "@/hooks/useComplaints";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
  atendimento: "Atendimento", produto: "Produto", preco: "Preço",
  fila: "Fila", limpeza: "Limpeza", estoque: "Estoque", outros: "Outros",
};

const SEVERITY_TONE: Record<string, string> = {
  leve: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
  media: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40",
  grave: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/40",
  muito_grave: "bg-destructive/15 text-destructive border-destructive/40",
};

const SEVERITY_LABEL: Record<string, string> = {
  leve: "Leve", media: "Média", grave: "Grave", muito_grave: "Muito grave",
};

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta", em_andamento: "Em andamento", resolvida: "Resolvida",
};

export function ComplaintCard({
  complaint, onClick,
}: { complaint: Complaint; onClick?: () => void }) {
  const date = new Date(complaint.created_at).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer transition hover:border-primary/40",
        complaint.status === "resolvida" && "opacity-70"
      )}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircleWarning className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm text-foreground truncate">
              {CATEGORY_LABEL[complaint.category] ?? complaint.category}
            </span>
            {complaint.setor && <Badge variant="outline" className="text-[10px]">{complaint.setor}</Badge>}
          </div>
          <Badge variant="outline" className={cn("text-[10px]", SEVERITY_TONE[complaint.severity])}>
            {SEVERITY_LABEL[complaint.severity]}
          </Badge>
        </div>
        <p className="text-sm text-foreground/80 line-clamp-2">{complaint.description}</p>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{date}</span>
          <Badge variant={complaint.status === "resolvida" ? "secondary" : "outline"} className="text-[10px]">
            {STATUS_LABEL[complaint.status]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
