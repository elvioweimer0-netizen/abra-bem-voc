import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRole";
import { getMonday, useMyCommitments } from "@/hooks/useWeeklyCommitments";
import { DeclararCompromissosModal } from "./DeclararCompromissosModal";
import { AvaliarCompromissosModal } from "./AvaliarCompromissosModal";
import { Target } from "lucide-react";

export function CommitmentsWidget() {
  const { isLider } = useRole();
  const week = useMemo(() => getMonday(), []);
  const { data } = useMyCommitments(week);
  const [declOpen, setDeclOpen] = useState(false);
  const [avalOpen, setAvalOpen] = useState(false);

  if (!isLider) return null;

  const today = new Date();
  const dow = today.getDay();
  const hasDeclared = (data?.length ?? 0) > 0;
  const allEvaluated = hasDeclared && data!.every((c) => !!c.evaluated_at);
  const showDeclare = !hasDeclared && dow >= 1 && dow <= 3;
  const showEvaluate = hasDeclared && !allEvaluated && (dow === 5 || dow === 6 || dow === 0);

  return (
    <>
      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-full bg-primary/15 text-primary p-2"><Target className="h-5 w-5" /></div>
            <div className="min-w-0">
              <p className="font-semibold">Compromissos da semana</p>
              <p className="text-xs text-muted-foreground">
                {hasDeclared ? `${data!.length} declarado(s)${allEvaluated ? " · avaliados" : ""}` : "Nenhum declarado"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showDeclare && <Button size="sm" onClick={() => setDeclOpen(true)}>Declarar</Button>}
            {showEvaluate && <Button size="sm" variant="secondary" onClick={() => setAvalOpen(true)}>Avaliar</Button>}
            {!showDeclare && !showEvaluate && (
              <Button asChild size="sm" variant="ghost"><Link to="/compromissos">Abrir</Link></Button>
            )}
          </div>
        </CardContent>
      </Card>
      <DeclararCompromissosModal open={declOpen} onOpenChange={setDeclOpen} existing={data} />
      <AvaliarCompromissosModal open={avalOpen} onOpenChange={setAvalOpen} commitments={data ?? []} />
    </>
  );
}
