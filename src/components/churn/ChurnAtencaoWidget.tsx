import { useAuth } from "@/contexts/AuthContext";
import { useTopChurnRisksForUnit, SIGNAL_LABELS } from "@/hooks/useChurnRisk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ChurnAtencaoWidget() {
  const { profile } = useAuth();
  const unitId = (profile as any)?.unit_id;
  const { data, isLoading } = useTopChurnRisksForUnit(unitId, 3);
  const navigate = useNavigate();

  if (isLoading || !data || data.length === 0) return null;

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-primary" />
          Atenção da semana
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{r.profile?.nome ?? "Colaborador"}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {r.signals.slice(0, 2).map((s) => (
                  <Badge key={s.code} variant="secondary" className="text-[10px]">{SIGNAL_LABELS[s.code] ?? s.code}</Badge>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-primary">{Math.round(r.risk_score)}</div>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => navigate(`/risco-churn/${r.user_id}`)}>Ver</Button>
            </div>
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground">Sinais preditivos. Converse antes de decidir.</p>
      </CardContent>
    </Card>
  );
}
