import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldOff, Eye } from "lucide-react";
import type { MysteryVisit } from "@/hooks/useMysteryVisits";

function scoreTone(score: number | null) {
  if (score == null) return "bg-muted text-muted-foreground border-border";
  if (score >= 8) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40";
  if (score >= 6) return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40";
  return "bg-destructive/15 text-destructive border-destructive/40";
}

export function MysteryVisitCard({
  visit,
  onOpen,
  showVisitor = false,
}: { visit: MysteryVisit; onOpen?: () => void; showVisitor?: boolean }) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold truncate">{visit.unit?.code} — {visit.unit?.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(visit.visit_date).toLocaleDateString("pt-BR")}
            {visit.visit_time && <> · {visit.visit_time.slice(0, 5)}</>}
            {showVisitor && !visit.anonymous_to_team && visit.visitor?.nome && (
              <> · {visit.visitor.nome}</>
            )}
          </p>
          {visit.notes && <p className="text-xs text-foreground/80 mt-2 line-clamp-2">{visit.notes}</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge variant="outline" className={scoreTone(visit.overall_score)}>
            {visit.overall_score != null ? `${Number(visit.overall_score).toFixed(1)}/10` : "—"}
          </Badge>
          <Badge variant="secondary" className="text-[10px] gap-1">
            {visit.anonymous_to_team ? <><ShieldCheck className="h-3 w-3" /> anônima</> : <><ShieldOff className="h-3 w-3" /> aberta</>}
          </Badge>
        </div>
      </div>
      {onOpen && (
        <Button size="sm" variant="ghost" onClick={onOpen} className="gap-1 w-full">
          <Eye className="h-3.5 w-3.5" />
          Ver detalhes
        </Button>
      )}
    </Card>
  );
}
