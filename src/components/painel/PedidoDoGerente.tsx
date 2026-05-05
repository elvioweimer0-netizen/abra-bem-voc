import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox, CheckCircle2 } from "lucide-react";
import { useMyManagerTasks, useMarkTaskDone } from "@/hooks/useManagerTasks";

export function PedidoDoGerente() {
  const { data: tasks = [], isLoading } = useMyManagerTasks();
  const markDone = useMarkTaskDone();
  const open = tasks.filter((t) => t.status === "aberto");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Inbox className="w-4 h-4" /> Pedidos do gerente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : open.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pedido em aberto.</p>
        ) : (
          open.map((t) => {
            const due = t.due_date ? new Date(t.due_date) : null;
            const today = new Date();
            const overdue = due && due < today;
            return (
              <div key={t.id} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.title}</p>
                    {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                  </div>
                  {due && (
                    <Badge variant={overdue ? "destructive" : "secondary"}>
                      {due.toLocaleDateString("pt-BR")}
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markDone.mutate(t.id)}
                  disabled={markDone.isPending}
                  className="w-full"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Marcar como feito
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
