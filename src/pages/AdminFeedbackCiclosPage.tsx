import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAllCycles, useUpsertCycle, useFeedbackQuestions } from "@/hooks/useManagerFeedback";

export default function AdminFeedbackCiclosPage() {
  const { data: cycles = [] } = useAllCycles();
  const { data: questions = [] } = useFeedbackQuestions();
  const upsert = useUpsertCycle();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [closes, setCloses] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().slice(0, 16);
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-2xl font-bold text-foreground">Ciclos de feedback</h1>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold text-foreground">Novo ciclo</p>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Ano</Label><Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></div>
            <div><Label>Tri</Label><Input type="number" min={1} max={4} value={quarter} onChange={(e) => setQuarter(Number(e.target.value))} /></div>
            <div><Label>Fecha em</Label><Input type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} /></div>
          </div>
          <Button onClick={() => upsert.mutate({ year, quarter, closes_at: new Date(closes).toISOString() })} disabled={upsert.isPending}>
            Abrir ciclo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold text-foreground">Ciclos existentes</p>
          {cycles.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{c.year}T{c.quarter}</p>
                <p className="text-xs text-muted-foreground">Fecha {new Date(c.closes_at).toLocaleString("pt-BR")} · {c.status}</p>
              </div>
              {c.status === "aberto" && (
                <Button variant="outline" size="sm" onClick={() => upsert.mutate({ id: c.id, year: c.year, quarter: c.quarter, closes_at: c.closes_at, status: "fechado" })}>
                  Encerrar
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold text-foreground">Perguntas ativas</p>
          {questions.map((q) => (
            <div key={q.id} className="rounded-lg border border-border p-3 text-sm text-foreground">
              {q.ordem}. {q.question_text}
              <span className="ml-2 text-xs text-muted-foreground">({q.code})</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
