import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgSolicitacoes, useTriagemRhOrgSolicitacao, type OrgSolicitacao } from "@/hooks/useOrgSolicitacoes";
import { useIsRhAdmin } from "@/hooks/useIsRhAdmin";
import { Navigate } from "react-router-dom";
import { Users2, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RhSolicitacoes() {
  const isRh = useIsRhAdmin();
  const { data: items = [], isLoading } = useOrgSolicitacoes({ status: "pendente_rh" });
  const triagem = useTriagemRhOrgSolicitacao();
  const [decision, setDecision] = useState<{ s: OrgSolicitacao; type: "aprovar" | "recusar" } | null>(null);
  const [motivo, setMotivo] = useState("");

  const ids = Array.from(new Set(items.flatMap((s) => [s.unit_id, s.solicitado_por, s.profile_id].filter(Boolean) as string[])));
  const { data: meta } = useQuery({
    queryKey: ["rh-solic-meta", ids.sort().join(",")],
    enabled: items.length > 0,
    queryFn: async () => {
      const unitIds = items.map((s) => s.unit_id);
      const profileIds = items.flatMap((s) => [s.solicitado_por, s.profile_id].filter(Boolean) as string[]);
      const [u, p] = await Promise.all([
        (supabase as any).from("units").select("id, name").in("id", unitIds),
        profileIds.length
          ? (supabase as any).from("profiles").select("id, nome, cargo_titulo, cargo_text").in("id", profileIds)
          : Promise.resolve({ data: [] }),
      ]);
      return {
        units: new Map<string, string>((u.data ?? []).map((x: any) => [x.id, x.name])),
        profs: new Map<string, any>((p.data ?? []).map((x: any) => [x.id, x])),
      };
    },
  });

  if (!isRh) return <Navigate to="/" replace />;

  const submit = async () => {
    if (!decision) return;
    if (decision.type === "recusar" && motivo.trim().length < 3) return;
    await triagem.mutateAsync({ id: decision.s.id, decision: decision.type, motivo: motivo.trim() || undefined });
    setDecision(null); setMotivo("");
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users2 className="h-6 w-6" /> Triagem RH · pedidos de quadro
        </h1>
        <p className="text-sm text-muted-foreground">
          Avalie pedidos de aumento de quadro antes do master decidir.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">Nenhum pedido pendente de RH.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map((s) => {
            const target = s.profile_id ? meta?.profs.get(s.profile_id) : null;
            return (
              <Card key={s.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between gap-2">
                    <span>
                      {meta?.profs.get(s.solicitado_por ?? "")?.nome ?? "Gerente"} ·{" "}
                      <span className="text-muted-foreground">{meta?.units.get(s.unit_id) ?? "—"}</span>
                    </span>
                    <Badge variant="secondary">aguardando RH</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-xs text-muted-foreground">
                    +{s.aumento_pretendido} · {s.tipo_solicitacao} · {s.setor_alvo ?? "—"} ·{" "}
                    {format(new Date(s.solicitado_em), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </p>
                  {target && (
                    <p className="text-[12px]">Quer alocar: <strong>{target.nome}</strong> <span className="text-muted-foreground">({target.cargo_titulo ?? target.cargo_text ?? "—"})</span></p>
                  )}
                  <p className="text-[13px]">{s.justificativa_texto}</p>
                  {s.numeros_jsonb && Object.keys(s.numeros_jsonb).length > 0 && (
                    <pre className="text-[11px] bg-muted/40 rounded p-1.5">{JSON.stringify(s.numeros_jsonb, null, 2)}</pre>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => { setDecision({ s, type: "aprovar" }); setMotivo(""); }}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar e enviar ao master
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setDecision({ s, type: "recusar" }); setMotivo(""); }}>
                      <XCircle className="h-4 w-4 mr-1" /> Recusar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!decision} onOpenChange={(v) => !v && setDecision(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{decision?.type === "aprovar" ? "Aprovar e enviar ao master" : "Recusar pedido"}</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={decision?.type === "aprovar" ? "Observação para o master (opcional)" : "Motivo da recusa (obrigatório)"}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>Cancelar</Button>
            <Button
              onClick={submit}
              disabled={triagem.isPending || (decision?.type === "recusar" && motivo.trim().length < 3)}
              variant={decision?.type === "recusar" ? "destructive" : "default"}
            >
              {decision?.type === "aprovar" ? "Aprovar" : "Recusar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
