import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgSolicitacoes, type OrgSolicitacao } from "@/hooks/useOrgSolicitacoes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_VARIANT: Record<OrgSolicitacao["status"], "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "secondary",
  aprovada: "default",
  recusada: "destructive",
  cancelada: "outline",
};

export default function HistoricoSolicitacoes() {
  const [status, setStatus] = useState<OrgSolicitacao["status"] | "todas">("todas");
  const { data: items = [] } = useOrgSolicitacoes({ status });

  const ids = useMemo(
    () => Array.from(new Set(items.flatMap((s) => [s.unit_id, s.solicitado_por, s.profile_id, s.decidido_por].filter(Boolean) as string[]))),
    [items]
  );
  const { data: meta } = useQuery({
    queryKey: ["solic-history-meta", ids.sort().join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const unitIds = items.map((s) => s.unit_id);
      const profileIds = items.flatMap((s) => [s.solicitado_por, s.profile_id, s.decidido_por].filter(Boolean) as string[]);
      const [u, p] = await Promise.all([
        (supabase as any).from("units").select("id, name").in("id", unitIds),
        profileIds.length
          ? (supabase as any).from("profiles").select("id, nome").in("id", profileIds)
          : Promise.resolve({ data: [] }),
      ]);
      return {
        units: new Map<string, string>((u.data ?? []).map((x: any) => [x.id, x.name])),
        profs: new Map<string, string>((p.data ?? []).map((x: any) => [x.id, x.nome])),
      };
    },
  });

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Histórico de solicitações de quadro</h1>
        <p className="text-sm text-muted-foreground">Pedidos de aumento de quadro, decisões e justificativas.</p>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as any)}>
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="aprovada">Aprovadas</TabsTrigger>
          <TabsTrigger value="recusada">Recusadas</TabsTrigger>
          <TabsTrigger value="cancelada">Canceladas</TabsTrigger>
        </TabsList>
      </Tabs>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma solicitação.</p>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between gap-2">
                  <span>
                    {meta?.profs.get(s.solicitado_por ?? "") ?? "Gerente"} ·{" "}
                    <span className="text-muted-foreground">{meta?.units.get(s.unit_id) ?? "—"}</span>
                  </span>
                  <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="text-xs text-muted-foreground">
                  +{s.aumento_pretendido} · {s.tipo_solicitacao} · {s.setor_alvo ?? "—"} ·{" "}
                  {format(new Date(s.solicitado_em), "dd/MM/yy HH:mm", { locale: ptBR })}
                </p>
                {s.profile_id && (
                  <p className="text-[12px]">Alocar: <strong>{meta?.profs.get(s.profile_id) ?? "—"}</strong></p>
                )}
                <p className="text-[13px]">{s.justificativa_texto}</p>
                {s.decidido_em && (
                  <p className="text-[11px] text-muted-foreground border-t pt-1 mt-1">
                    Decidido por {meta?.profs.get(s.decidido_por ?? "") ?? "—"} em{" "}
                    {format(new Date(s.decidido_em), "dd/MM/yy HH:mm", { locale: ptBR })}
                    {s.motivo_decisao ? ` — ${s.motivo_decisao}` : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
