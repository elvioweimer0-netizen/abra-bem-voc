import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { usePendingDecisions } from "@/hooks/useMasterData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function DecisoesPendentes() {
  const { data: decisions = [], isLoading } = usePendingDecisions();
  const qc = useQueryClient();
  const { user } = useAuth();

  async function decide(id: string, status: "approved" | "rejected") {
    const { error } = await supabase
      .from("master_pending_decisions")
      .update({ status, decided_at: new Date().toISOString(), decided_by: user?.id })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "approved" ? "Aprovado" : "Recusado");
      qc.invalidateQueries({ queryKey: ["pending_decisions"] });
    }
  }

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" /> Decisões esperando você
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
        ) : decisions.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Nenhuma decisão pendente.</p>
        ) : (
          <div className="divide-y">
            {decisions.map((d: any) => (
              <div key={d.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {d.type} · há {formatDistanceToNow(new Date(d.created_at), { locale: ptBR })}
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-success" onClick={() => decide(d.id, "approved")}>
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => decide(d.id, "rejected")}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
