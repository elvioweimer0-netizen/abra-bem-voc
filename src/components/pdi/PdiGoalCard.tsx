import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays } from "lucide-react";
import type { PdiGoal } from "@/hooks/usePdi";
import { STATUS_LABEL } from "@/hooks/usePdi";
import { format, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_VARIANT: Record<PdiGoal["status"], string> = {
  em_andamento: "bg-blue-100 text-blue-800",
  atingida: "bg-emerald-100 text-emerald-800",
  parcialmente_atingida: "bg-amber-100 text-amber-800",
  nao_atingida: "bg-rose-100 text-rose-800",
  cancelada: "bg-muted text-muted-foreground",
};

export function PdiGoalCard({ goal, onClick }: { goal: PdiGoal; onClick?: () => void }) {
  const pct =
    goal.meta_valor && goal.meta_valor > 0 && goal.valor_atual != null
      ? Math.min(100, Math.round(((goal.valor_atual ?? 0) / goal.meta_valor) * 100))
      : null;

  const overdue =
    goal.status === "em_andamento" &&
    goal.prazo &&
    isBefore(parseISO(goal.prazo), new Date());

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer p-4 transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground line-clamp-2">{goal.titulo}</h3>
        <Badge className={STATUS_VARIANT[goal.status]}>{STATUS_LABEL[goal.status]}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {goal.trimestre}º Trim · {goal.ano}
      </p>

      {pct != null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {goal.valor_atual ?? 0} / {goal.meta_valor} {goal.meta_unidade ?? ""}
            </span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="mt-1 h-2" />
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs">
        {goal.prazo && (
          <Badge variant="outline" className={overdue ? "border-rose-500 text-rose-700" : ""}>
            <CalendarDays className="mr-1 h-3 w-3" />
            {format(parseISO(goal.prazo), "dd/MM/yyyy", { locale: ptBR })}
            {overdue && " · atrasada"}
          </Badge>
        )}
      </div>
    </Card>
  );
}
