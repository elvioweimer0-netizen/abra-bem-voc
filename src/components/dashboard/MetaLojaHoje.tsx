import { useAuth } from "@/contexts/AuthContext";
import { useSalesToday } from "@/hooks/useSalesToday";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingDown, TrendingUp, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

const fmtBrl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function relativeMinutes(iso: string | null) {
  if (!iso) return "—";
  const diff = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diff < 1) return "agora";
  if (diff < 60) return `há ${diff} min`;
  return `há ${Math.round(diff / 60)} h`;
}

export function MetaLojaHoje() {
  const { profile } = useAuth();
  const allowed = ["gerente_loja", "gerente", "admin", "master", "supervisor"].includes(profile?.cargo ?? "");
  const { data, isLoading } = useSalesToday(allowed ? profile?.unit_id ?? undefined : undefined);

  if (!allowed || !profile?.unit_id) return null;
  if (isLoading || !data) return null;

  const targetDay = data.target_today_prorated || 0;
  const pct = targetDay > 0 ? Math.min(100, (data.revenue_today / targetDay) * 100) : 0;
  const vsYest = data.revenue_today - data.revenue_yesterday;
  const vsLastWeek = data.revenue_today - data.revenue_last_week_same_dow;

  return (
    <Card className="card-shadow border-l-4 border-l-primary">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-base">Meta de hoje</h3>
          <span className="ml-auto text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> {relativeMinutes(data.last_updated_at)}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-end justify-between gap-2">
            <span className="text-2xl font-bold">{fmtBrl(data.revenue_today)}</span>
            <span className="text-xs text-muted-foreground">de {fmtBrl(targetDay)}</span>
          </div>
          <Progress value={pct} className="h-2.5" />
          <div className="text-xs text-muted-foreground">{pct.toFixed(0)}% da meta diária prorrateada</div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-muted/50 p-2.5">
            <div className="text-muted-foreground">vs ontem</div>
            <div className={`font-semibold flex items-center gap-1 ${vsYest >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {vsYest >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {fmtBrl(Math.abs(vsYest))}
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-2.5">
            <div className="text-muted-foreground">vs semana passada</div>
            <div className={`font-semibold flex items-center gap-1 ${vsLastWeek >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {vsLastWeek >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {fmtBrl(Math.abs(vsLastWeek))}
            </div>
          </div>
        </div>

        <Link to="/vendas" className="text-xs text-primary hover:underline">Abrir painel completo →</Link>
      </CardContent>
    </Card>
  );
}
