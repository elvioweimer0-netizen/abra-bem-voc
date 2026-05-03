import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import {
  getMonday,
  getWeekRangeLabel,
  useCommitmentHistory,
  useMyCommitments,
} from "@/hooks/useWeeklyCommitments";
import { CommitmentStatusBadge } from "@/components/commitments/CommitmentStatusBadge";
import { DeclararCompromissosModal } from "@/components/commitments/DeclararCompromissosModal";
import { AvaliarCompromissosModal } from "@/components/commitments/AvaliarCompromissosModal";

export default function Compromissos() {
  const { profile } = useAuth();
  const { isLider } = useRole();
  const week = useMemo(() => getMonday(), []);
  const { data: current } = useMyCommitments(week);
  const { data: history } = useCommitmentHistory((profile as any)?.user_id, 8);

  const [declOpen, setDeclOpen] = useState(false);
  const [avalOpen, setAvalOpen] = useState(false);

  if (!isLider) return <Navigate to="/" replace />;

  const today = new Date();
  const dow = today.getDay();
  const hasDeclared = (current?.length ?? 0) > 0;
  const allEvaluated = hasDeclared && current!.every((c) => !!c.evaluated_at);
  const canDeclare = dow >= 1 && dow <= 3;
  const canEvaluate = hasDeclared && (dow === 5 || dow === 6 || dow === 0);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof history>();
    (history ?? []).forEach((c) => {
      if (c.week_start_date === week) return;
      const arr = (m.get(c.week_start_date) ?? []) as any[];
      arr.push(c);
      m.set(c.week_start_date, arr as any);
    });
    return Array.from(m.entries());
  }, [history, week]);

  return (
    <div className="container mx-auto max-w-3xl space-y-5 p-4">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Compromissos da semana</h1>
          <p className="text-sm text-muted-foreground">{getWeekRangeLabel(week)}</p>
        </div>
        <div className="flex gap-2">
          {canDeclare && <Button onClick={() => setDeclOpen(true)}>{hasDeclared ? "Editar" : "Declarar"}</Button>}
          {canEvaluate && !allEvaluated && <Button variant="secondary" onClick={() => setAvalOpen(true)}>Avaliar</Button>}
        </div>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base">Esta semana</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!hasDeclared && <p className="text-sm text-muted-foreground">Você ainda não declarou compromissos esta semana.</p>}
          {(current ?? []).map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-3">
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm font-medium">{c.ordem}. {c.commitment_text}</p>
                <CommitmentStatusBadge status={c.status} />
              </div>
              {c.evidencia && <p className="mt-2 text-xs text-muted-foreground">{c.evidencia}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      {!!grouped.length && (
        <Card>
          <CardHeader><CardTitle className="text-base">Semanas anteriores</CardTitle></CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {grouped.map(([wk, items]) => (
                <AccordionItem key={wk} value={wk}>
                  <AccordionTrigger>{getWeekRangeLabel(wk)}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {(items as any[]).map((c) => (
                        <div key={c.id} className="rounded border border-border p-2">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm">{c.ordem}. {c.commitment_text}</p>
                            <CommitmentStatusBadge status={c.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      <DeclararCompromissosModal open={declOpen} onOpenChange={setDeclOpen} existing={current} />
      <AvaliarCompromissosModal open={avalOpen} onOpenChange={setAvalOpen} commitments={current ?? []} />
    </div>
  );
}
