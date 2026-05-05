import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMasterAgenda, useGerentesOverview } from "@/hooks/useMasterData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function MasterAgenda() {
  const { user } = useAuth();
  const { data } = useMasterAgenda();
  const { data: gerentes = [] } = useGerentesOverview();
  const qc = useQueryClient();
  const [gerenteId, setGerenteId] = useState("");
  const [dt, setDt] = useState("");

  async function marcar() {
    if (!user || !gerenteId || !dt) return toast.error("Preencha tudo");
    const { error } = await supabase.from("master_one_on_ones").insert({
      master_user_id: user.id,
      gerente_user_id: gerenteId,
      scheduled_for: new Date(dt).toISOString(),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("1:1 agendada");
      setGerenteId(""); setDt("");
      qc.invalidateQueries({ queryKey: ["master_agenda"] });
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <Card className="rounded-xl">
        <CardHeader><CardTitle className="text-base">Marcar 1:1</CardTitle></CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-2">
          <select className="flex-1 rounded-md border bg-background px-3 h-10 text-sm" value={gerenteId} onChange={(e) => setGerenteId(e.target.value)}>
            <option value="">Selecione gerente...</option>
            {gerentes.map((g) => (
              <option key={g.user_id} value={g.user_id}>{g.nome}</option>
            ))}
          </select>
          <Input type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} />
          <Button onClick={marcar}>Agendar</Button>
        </CardContent>
      </Card>
      <Card className="rounded-xl">
        <CardHeader><CardTitle className="text-base">Próximas 1:1s</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(data?.oneOnOnes ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhuma 1:1 agendada.</p>}
          {(data?.oneOnOnes ?? []).map((o: any) => (
            <div key={o.id} className="flex justify-between text-sm border-b pb-2 last:border-0">
              <span>{new Date(o.scheduled_for).toLocaleString("pt-BR")}</span>
              <span className="text-muted-foreground">{o.completed_at ? "✓ realizada" : "agendada"}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-xl">
        <CardHeader><CardTitle className="text-base">Visitas agendadas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(data?.visits ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhuma visita agendada.</p>}
          {(data?.visits ?? []).map((v: any) => (
            <div key={v.id} className="flex justify-between text-sm border-b pb-2 last:border-0">
              <span>{new Date(v.scheduled_for).toLocaleDateString("pt-BR")}</span>
              <span className="text-muted-foreground">{v.completed_at ? "✓ realizada" : "agendada"}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
