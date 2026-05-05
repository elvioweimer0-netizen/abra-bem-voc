import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSalesToday } from "@/hooks/useSalesToday";
import { useMyScores } from "@/hooks/useManagerScore";
import { useMyCommitments, getMonday } from "@/hooks/useWeeklyCommitments";
import { HeaderSaudacao } from "@/components/painel/HeaderSaudacao";
import { KpiCard } from "@/components/painel/KpiCard";
import { AcoesRapidasPainel } from "@/components/painel/AcoesRapidasPainel";
import { PendenciasMinhas } from "@/components/painel/PendenciasMinhas";
import { EquipeOverview } from "@/components/painel/EquipeOverview";
import { CompromissosCalendario } from "@/components/painel/CompromissosCalendario";
import { DesenvolvimentoPessoal } from "@/components/painel/DesenvolvimentoPessoal";
import { ComunicacaoBar } from "@/components/painel/ComunicacaoBar";
import { AlertasRiscos } from "@/components/painel/AlertasRiscos";
import { AtalhoDoGuga } from "@/components/painel/AtalhoDoGuga";
import { TrendingUp, Target, Trophy, DollarSign, Sun, AlertTriangle, MessageSquarePlus, Bell, MessageSquare } from "lucide-react";

export default function PainelGerente() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const unitId = (profile as any)?.unit_id as string | undefined;
  const { data: sales } = useSalesToday(unitId);
  const { data: scores = [] } = useMyScores(2);
  const { data: commitments = [] } = useMyCommitments(getMonday());

  const lastScore = scores[scores.length - 1];
  const prevScore = scores[scores.length - 2];
  const scoreDelta = lastScore && prevScore ? (lastScore.final_score - prevScore.final_score).toFixed(1) : null;
  const nextCommitment = commitments.find((c) => c.status === "em_andamento");

  const achievement = sales?.achievement_pct ?? null;
  const tone = achievement == null ? "muted" : achievement >= 100 ? "success" : achievement >= 80 ? "warning" : "destructive";

  return (
    <div className="space-y-5 pb-20 lg:pb-5">
      <HeaderSaudacao subtitle={profile?.unidade ?? undefined} />

      <AtalhoDoGuga />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Vendas hoje"
          value={achievement != null ? `${achievement.toFixed(0)}%` : "—"}
          delta={sales ? `R$ ${(sales.revenue_today ?? 0).toLocaleString("pt-BR")}` : undefined}
          hint="da meta diária"
          icon={TrendingUp}
          tone={tone as any}
          onClick={() => navigate("/vendas")}
        />
        <KpiCard
          title="Compromisso ativo"
          value={nextCommitment ? "1" : "0"}
          delta={nextCommitment?.commitment_text?.slice(0, 32)}
          icon={Target}
          tone={nextCommitment ? "primary" : "muted"}
          onClick={() => navigate("/compromissos")}
        />
        <KpiCard
          title="Score atual"
          value={lastScore ? lastScore.final_score.toFixed(1) : "—"}
          delta={scoreDelta ? `${Number(scoreDelta) >= 0 ? "+" : ""}${scoreDelta} vs mês anterior` : undefined}
          icon={Trophy}
          tone="primary"
          onClick={() => navigate("/meu-score")}
        />
        <KpiCard
          title="Bônus projetado"
          value="—"
          hint="em breve"
          icon={DollarSign}
          tone="muted"
        />
      </div>

      <AcoesRapidasPainel
        acoes={[
          { label: "Iniciar meu dia", icon: Sun, onClick: () => navigate("/") },
          { label: "+ Incidente", icon: AlertTriangle, onClick: () => navigate("/seguranca"), tone: "bg-destructive/10 text-destructive" },
          { label: "+ Reclamação", icon: MessageSquarePlus, onClick: () => navigate("/reclamacoes"), tone: "bg-warning/10 text-warning" },
          { label: "+ Aviso", icon: Bell, onClick: () => navigate("/avisos") },
          { label: "Resumo WhatsApp", icon: MessageSquare, onClick: () => navigate("/whatsapp-resumo") },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PendenciasMinhas />
        <EquipeOverview />
      </div>

      <CompromissosCalendario />

      <DesenvolvimentoPessoal />

      <AlertasRiscos alertas={[]} />

      <div className="lg:hidden">
        <ComunicacaoBar />
      </div>
    </div>
  );
}
