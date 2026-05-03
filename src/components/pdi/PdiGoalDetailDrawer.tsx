import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { PdiProgressTimeline } from "./PdiProgressTimeline";
import { PdiProgressForm } from "./PdiProgressForm";
import { useUpdateGoalStatus, STATUS_LABEL, type PdiGoal, type PdiStatus } from "@/hooks/usePdi";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function PdiGoalDetailDrawer({
  goal,
  onClose,
}: {
  goal: PdiGoal | null;
  onClose: () => void;
}) {
  const { profile } = useAuth();
  const { isAdmin, isSupervisor, isGerenteLoja } = useRole();
  const [progressOpen, setProgressOpen] = useState(false);
  const updateStatus = useUpdateGoalStatus();

  if (!goal) return null;

  const isOwner = profile?.user_id === goal.encarregado_user_id;
  const isAuthor = profile?.user_id === goal.gerente_user_id;
  const canManage = isAdmin || isSupervisor || isGerenteLoja || isAuthor;
  const canPostProgress = isOwner || canManage;

  const pct =
    goal.meta_valor && goal.meta_valor > 0 && goal.valor_atual != null
      ? Math.min(100, Math.round((goal.valor_atual / goal.meta_valor) * 100))
      : null;

  return (
    <>
      <Sheet open={!!goal} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{goal.titulo}</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">{goal.trimestre}º Trim · {goal.ano}</Badge>
              {goal.prazo && (
                <Badge variant="outline">
                  Prazo: {format(parseISO(goal.prazo), "dd/MM/yyyy", { locale: ptBR })}
                </Badge>
              )}
              <Badge>{STATUS_LABEL[goal.status]}</Badge>
            </div>

            <p className="whitespace-pre-line text-sm text-muted-foreground">{goal.descricao}</p>

            {pct != null && (
              <div>
                <div className="flex justify-between text-xs">
                  <span>{goal.valor_atual ?? 0} / {goal.meta_valor} {goal.meta_unidade ?? ""}</span>
                  <span>{pct}%</span>
                </div>
                <Progress value={pct} className="mt-1 h-2" />
              </div>
            )}

            {canManage && (
              <div>
                <p className="mb-1 text-xs font-medium">Alterar status</p>
                <Select
                  value={goal.status}
                  onValueChange={(v) => updateStatus.mutate({ id: goal.id, status: v as PdiStatus })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as PdiStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <h4 className="font-semibold text-sm">Histórico</h4>
              {canPostProgress && goal.status === "em_andamento" && (
                <Button size="sm" onClick={() => setProgressOpen(true)}>Adicionar atualização</Button>
              )}
            </div>
            <PdiProgressTimeline goalId={goal.id} />
          </div>
        </SheetContent>
      </Sheet>

      {progressOpen && (
        <PdiProgressForm
          open={progressOpen}
          onClose={() => setProgressOpen(false)}
          goalId={goal.id}
          hasMetaValor={!!goal.meta_valor}
        />
      )}
    </>
  );
}
