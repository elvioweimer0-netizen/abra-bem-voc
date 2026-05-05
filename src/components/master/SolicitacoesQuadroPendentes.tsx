import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users2, CheckCircle2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgSolicitacoes, useDecideOrgSolicitacao, type OrgSolicitacao } from "@/hooks/useOrgSolicitacoes";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function NumerosInline({ n }: { n: Record<string, any> | null }) {
  if (!n || Object.keys(n).length === 0) return null;
  return (
    <ul className="mt-1 text-[11px] text-muted-foreground space-y-0.5">
      {n.vendas_aumentaram_pct != null && <li>• Vendas +{n.vendas_aumentaram_pct}%</li>}
      {n.ruptura_horas_dia != null && <li>• Ruptura {n.ruptura_horas_dia}h/dia</li>}
      {n.demanda_pico && <li>• Pico: {n.demanda_pico}</li>}
      {n.outro && <li>• {n.outro}</li>}
    </ul>
  );
}

export function SolicitacoesQuadroPendentes() {
  const { data: items = [], isLoading } = useOrgSolicitacoes({ status: "pendente_master" });
  const decide = useDecideOrgSolicitacao();
  const [decision, setDecision] = useState<{ s: OrgSolicitacao; type: "aprovar" | "recusar" } | null>(null);
  const [motivo, setMotivo] = useState("");

  const ids = Array.from(new Set(items.flatMap((s) => [s.unit_id, s.solicitado_por, s.profile_id].filter(Boolean) as string[])));
  const { data: meta } = useQuery({
    queryKey: ["org-solic-meta", ids.sort().join(",")],
    enabled: items.length > 0,
    queryFn: async () => {
      const unitIds = items.map((s) => s.unit_id);
      const profileIds = items.flatMap((s) => [s.solicitado_por, s.profile_id].filter(Boolean) as string[]);
      const [u, p] = await Promise.all([
        (supabase as any).from("units").select("id, name").in("id", unitIds),
        profileIds.length
          ? (supabase as any).from("profiles").select("id, nome").in("id", profileIds)
          : Promise.resolve({ data: [] }),
      ]);
      const units = new Map<string, string>((u.data ?? []).map((x: any) => [x.id, x.name]));
      const profs = new Map<string, string>((p.data ?? []).map((x: any) => [x.id, x.nome]));
      return { units, profs };
    },
  });

  const submit = async () => {
    if (!decision) return;
    if (decision.type === "recusar" && motivo.trim().length < 3) return;
    await decide.mutateAsync({ id: decision.s.id, decision: decision.type, motivo: motivo.trim() || undefined });
    setDecision(null);
    setMotivo("");
  };

  return (
    <>
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users2 className="h-4 w-4" /> Aumentar quadro · pedidos pendentes
            {items.length > 0 && <Badge variant="secondary">{items.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Sem pedidos pendentes.</p>
          ) : (
            <div className="divide-y">
              {items.map((s) => (
                <div key={s.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {meta?.profs.get(s.solicitado_por ?? "") ?? "Gerente"} ·{" "}
                        <span className="text-muted-foreground">{meta?.units.get(s.unit_id) ?? "Unidade"}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        +{s.aumento_pretendido} pessoa(s) · {s.setor_alvo ?? "—"} · há {formatDistanceToNow(new Date(s.solicitado_em), { locale: ptBR })}
                      </p>
                      {s.profile_id && (
                        <p className="text-[12px] mt-1">Quer alocar: <strong>{meta?.profs.get(s.profile_id) ?? "—"}</strong></p>
                      )}
                      <p className="mt-1 text-[12px] text-foreground/90 line-clamp-3">{s.justificativa_texto}</p>
                      <NumerosInline n={s.numeros_jsonb} />
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 text-success" onClick={() => { setDecision({ s, type: "aprovar" }); setMotivo(""); }}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => { setDecision({ s, type: "recusar" }); setMotivo(""); }}>
                        <XCircle className="h-4 w-4 mr-1" /> Recusar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!decision} onOpenChange={(v) => !v && setDecision(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{decision?.type === "aprovar" ? "Aprovar pedido" : "Recusar pedido"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {decision?.type === "aprovar"
                ? "O total desejado da unidade aumentará e a alocação será efetivada."
                : "Informe o motivo da recusa (obrigatório)."}
            </p>
            <Textarea
              rows={4}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={decision?.type === "aprovar" ? "Observação (opcional)" : "Motivo da recusa"}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>Cancelar</Button>
            <Button
              onClick={submit}
              disabled={decide.isPending || (decision?.type === "recusar" && motivo.trim().length < 3)}
              variant={decision?.type === "recusar" ? "destructive" : "default"}
            >
              {decision?.type === "aprovar" ? "Aprovar" : "Recusar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
