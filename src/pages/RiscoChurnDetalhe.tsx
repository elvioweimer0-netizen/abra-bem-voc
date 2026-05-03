import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChurnRiskByUser, SIGNAL_LABELS, STATUS_LABELS } from "@/hooks/useChurnRisk";
import { ChurnEthicsDisclaimer } from "@/components/churn/ChurnEthicsDisclaimer";
import { ResolverChurnModal } from "@/components/churn/ResolverChurnModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function RiscoChurnDetalhe() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useChurnRiskByUser(userId);
  const [resolveId, setResolveId] = useState<string | null>(null);

  const latest = data?.[0];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>

      <div>
        <h1 className="text-2xl font-bold">{latest?.profile?.nome ?? "Colaborador"}</h1>
        <p className="text-sm text-muted-foreground">{latest?.unit?.name ?? ""}</p>
      </div>

      <ChurnEthicsDisclaimer />

      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : !data?.length ? <p className="text-muted-foreground">Sem registros.</p> : (
        <div className="space-y-3">
          {data.map((r, idx) => (
            <Card key={r.id} className={idx === 0 && r.status === "ativo" ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{r.calculated_at} · score {Math.round(r.risk_score)}</span>
                  <Badge variant="outline">{STATUS_LABELS[r.status]}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {r.signals.map((s) => (
                    <Badge key={s.code} variant="secondary">{SIGNAL_LABELS[s.code] ?? s.code}{s.detail ? ` · ${s.detail}` : ""}</Badge>
                  ))}
                </div>
                {r.recommended_action && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <strong>Sugestão:</strong> {r.recommended_action}
                  </div>
                )}
                {r.resolution_note && (
                  <div className="rounded-md border p-3 text-sm">
                    <strong>Resolução:</strong> {r.resolution_note}
                    {r.resolved_at && <span className="text-xs text-muted-foreground ml-2">{new Date(r.resolved_at).toLocaleString("pt-BR")}</span>}
                  </div>
                )}
                {r.status === "ativo" && idx === 0 && (
                  <Button size="sm" onClick={() => setResolveId(r.id)}>Marcar resolução</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {resolveId && (
        <ResolverChurnModal id={resolveId} open={!!resolveId} onOpenChange={(v) => !v && setResolveId(null)} />
      )}
    </div>
  );
}
