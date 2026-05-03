import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAllCycles, useManagerAggregated, useManagerComments } from "@/hooks/useManagerFeedback";
import { ManagerScoreCard } from "@/components/feedback/ManagerScoreCard";
import { FeedbackTrendChart } from "@/components/feedback/FeedbackTrendChart";

export default function MeuFeedbackPage() {
  const { user } = useAuth();
  const { data: cycles = [] } = useAllCycles();
  const [cycleId, setCycleId] = useState<string | null>(null);
  const activeCycle = cycleId ?? cycles[0]?.id ?? null;

  const { data: rowsAll = [] } = useManagerAggregated(user?.id, null); // todos ciclos pra trend
  const { data: rowsCycle = [], isLoading } = useManagerAggregated(user?.id, activeCycle);
  const { data: comments = [] } = useManagerComments(user?.id, activeCycle ?? undefined);

  const cycleOptions = useMemo(() => cycles, [cycles]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu feedback</h1>
        <p className="text-sm text-muted-foreground">
          Resultados agregados anonimamente. Mínimo 3 respostas por pergunta para exibição.
        </p>
      </div>

      <Tabs value={activeCycle ?? ""} onValueChange={setCycleId}>
        <TabsList className="flex-wrap">
          {cycleOptions.map((c) => (
            <TabsTrigger key={c.id} value={c.id}>{c.year}T{c.quarter}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeCycle ?? ""} className="mt-4 space-y-3">
          {isLoading ? (
            <Card><CardContent className="p-4 text-sm">Carregando...</CardContent></Card>
          ) : rowsCycle.length === 0 ? (
            <Card><CardContent className="p-4 text-sm text-muted-foreground">
              Aguardando mais respostas (mínimo 3) para exibir resultados.
            </CardContent></Card>
          ) : (
            rowsCycle.map((r) => <ManagerScoreCard key={r.question_id} row={r} />)
          )}

          {comments.length > 0 && (
            <Card>
              <CardContent className="space-y-2 p-4">
                <p className="text-sm font-semibold text-foreground">Comentários anônimos</p>
                {comments.map((c, i) => (
                  <p key={i} className="rounded-lg bg-muted p-3 text-sm text-foreground">"{c}"</p>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold text-foreground">Tendência ao longo dos ciclos</p>
          <FeedbackTrendChart rows={rowsAll} cycles={cycles} />
        </CardContent>
      </Card>
    </div>
  );
}
