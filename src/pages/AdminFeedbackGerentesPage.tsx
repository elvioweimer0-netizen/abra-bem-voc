import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAllCycles, useAllManagers, useManagerAggregated } from "@/hooks/useManagerFeedback";
import { ManagerScoreCard } from "@/components/feedback/ManagerScoreCard";

function ManagerSection({ managerId, managerName, cycleId }: { managerId: string; managerName: string; cycleId: string }) {
  const { data: rows = [] } = useManagerAggregated(managerId, cycleId);
  const overall = rows.length > 0
    ? (rows.reduce((s, r) => s + Number(r.avg_score), 0) / rows.length).toFixed(2)
    : "—";
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{managerName}</p>
          <p className="text-lg font-bold text-primary">{overall}</p>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem dados (mínimo 3 respostas).</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.question_id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{r.question_text}</span>
                <span className="font-medium text-foreground">{r.avg_score.toFixed(1)} ({r.count_responses})</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminFeedbackGerentesPage() {
  const { data: cycles = [] } = useAllCycles();
  const { data: managers = [] } = useAllManagers();
  const [cycleId, setCycleId] = useState<string | null>(null);
  const active = cycleId ?? cycles[0]?.id ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <h1 className="text-2xl font-bold text-foreground">Feedback dos gerentes</h1>

      <Tabs value={active ?? ""} onValueChange={setCycleId}>
        <TabsList className="flex-wrap">
          {cycles.map((c) => (
            <TabsTrigger key={c.id} value={c.id}>{c.year}T{c.quarter}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={active ?? ""} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {managers.length === 0 || !active ? (
            <Card><CardContent className="p-4 text-sm text-muted-foreground">Sem gerentes/ciclo.</CardContent></Card>
          ) : (
            managers.map((m: any) => (
              <ManagerSection key={m.user_id} managerId={m.user_id} managerName={m.nome} cycleId={active} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
