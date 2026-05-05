import { useNavigate } from "react-router-dom";
import { Activity, Users, AlertTriangle, DollarSign } from "lucide-react";
import { KpiCard } from "@/components/painel/KpiCard";
import { useNetworkSalesToday, useNetworkUrgencias, useGerentesOverview } from "@/hooks/useMasterData";

export function KpiRedeBar() {
  const navigate = useNavigate();
  const { data: sales } = useNetworkSalesToday();
  const { data: urg } = useNetworkUrgencias();
  const { data: gerentes = [] } = useGerentesOverview();

  const okGerentes = gerentes.filter((g) => (g.score ?? 0) >= 7).length;
  const yellowGerentes = gerentes.filter((g) => (g.score ?? 0) >= 5 && (g.score ?? 0) < 7).length;
  const redGerentes = gerentes.filter((g) => g.score != null && g.score < 5).length;

  const achievement = sales?.achievementPct ?? null;
  const tone = achievement == null ? "muted" : achievement >= 100 ? "success" : achievement >= 80 ? "warning" : "destructive";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        pergunta="A rede tá indo bem?"
        title="Vendas rede hoje"
        value={achievement != null ? `${achievement.toFixed(0)}%` : "—"}
        delta={sales ? `R$ ${sales.totalRev.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}` : undefined}
        deltaDirection={achievement == null ? "flat" : achievement >= 100 ? "up" : "down"}
        narrativa={sales ? `${sales.okCount} de ${sales.totalLojas} lojas batendo meta hoje` : "Carregando..."}
        icon={Activity}
        tone={tone as any}
      />
      <KpiCard
        pergunta="Quantos gerentes tão OK?"
        title="Saúde gerentes"
        value={`${okGerentes}/${gerentes.length || 0}`}
        narrativa={`${redGerentes} crítico(s) · ${yellowGerentes} atenção · ${okGerentes} bem`}
        icon={Users}
        tone={redGerentes > 0 ? "destructive" : yellowGerentes > 0 ? "warning" : "success"}
      />
      <KpiCard
        pergunta="Tem urgência hoje?"
        title="Urgências abertas"
        value={urg?.total ?? 0}
        narrativa={urg ? `${urg.incidents.length} incidente(s) grave(s) · ${urg.complaints.length} reclamação(ões) >3d` : "—"}
        icon={AlertTriangle}
        tone={(urg?.total ?? 0) > 0 ? "destructive" : "success"}
        onClick={() => navigate("/seguranca")}
      />
      <KpiCard
        pergunta="Quanto bônus a rede projeta?"
        title="Bônus projetado"
        value="—"
        narrativa="Cálculo em desenvolvimento"
        icon={DollarSign}
        tone="muted"
      />
    </div>
  );
}
