import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSalesToday } from "@/hooks/useSalesToday";
import { useMyScores } from "@/hooks/useManagerScore";
import { useMyCommitments, getMonday } from "@/hooks/useWeeklyCommitments";
import { usePainelMode } from "@/hooks/usePainelMode";
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
import { RecomendacoesDoDia } from "@/components/painel/RecomendacoesDoDia";
import { PainelOnboarding } from "@/components/painel/PainelOnboarding";
import { FabRapido } from "@/components/painel/FabRapido";
import { ConfeteCelebracao } from "@/components/painel/ConfeteCelebracao";
import { TrendingUp, Target, Trophy, DollarSign, Sun, AlertTriangle, MessageSquarePlus, Bell, MessageSquare } from "lucide-react";

export default function PainelGerente() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { mode } = usePainelMode();
  const unitId = (profile as any)?.unit_id as string | undefined;
  const { data: sales } = useSalesToday(unitId);
  const { data: scores = [] } = useMyScores(2);
  const { data: commitments = [] } = useMyCommitments(getMonday());

  const lastScore = scores[scores.length - 1];
  const prevScore = scores[scores.length - 2];
  const scoreDelta = lastScore && prevScore ? lastScore.final_score - prevScore.final_score : null;
  const nextCommitment = commitments.find((c) => c.status === "em_andamento");

  const achievement = sales?.achievement_pct ?? null;
  const tone = achievement == null ? "muted" : achievement >= 100 ? "success" : achievement >= 80 ? "warning" : "destructive";
  const revenue = sales?.revenue_today ?? 0;
  const vendasNarrativa =
    achievement == null
      ? "Sem dados ainda hoje."
      : achievement >= 100
      ? `Hoje vendeu R$ ${revenue.toLocaleString("pt-BR")}. Já bateu meta!`
      : `Hoje: R$ ${revenue.toLocaleString("pt-BR")}. Falta ${(100 - achievement).toFixed(0)}% pra meta.`;

  const scoreNarrativa = lastScore
    ? scoreDelta == null
      ? "Sua primeira nota."
      : scoreDelta > 0
      ? `Subiu ${scoreDelta.toFixed(1)} desde mês passado.`
      : scoreDelta < 0
      ? `Caiu ${Math.abs(scoreDelta).toFixed(1)} desde mês passado.`
      : "Manteve desde mês passado."
    : "Aguardando primeira avaliação.";

  const resumoTexto = `${vendasNarrativa}. ${scoreNarrativa}. ${nextCommitment ? "Você tem um compromisso ativo." : "Sem compromisso ativo agora."}`;

  return (
    <div className="space-y-5 pb-24 lg:pb-5">
      <PainelOnboarding />
      <ConfeteCelebracao trigger={achievement != null && achievement >= 100} />

      <HeaderSaudacao subtitle={profile?.unidade ?? undefined} resumoTexto={resumoTexto} />

      <AtalhoDoGuga />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          pergunta="Vai bater meta hoje?"
          title="Vendas hoje"
          value={achievement != null ? `${achievement.toFixed(0)}%` : "—"}
          delta={sales ? `R$ ${revenue.toLocaleString("pt-BR")}` : undefined}
          deltaDirection={achievement == null ? "flat" : achievement >= 100 ? "up" : "down"}
          narrativa={vendasNarrativa}
          icon={TrendingUp}
          tone={tone as any}
          helpKey="vendas_hoje"
          onClick={() => navigate("/vendas")}
        />
        <KpiCard
          pergunta="O que você prometeu?"
          title="Compromisso ativo"
          value={nextCommitment ? "1" : "0"}
          narrativa={nextCommitment?.commitment_text?.slice(0, 60) || "Nenhum compromisso em andamento."}
          icon={Target}
          tone={nextCommitment ? "primary" : "muted"}
          helpKey="compromisso"
          onClick={() => navigate("/compromissos")}
        />
        <KpiCard
          pergunta="Sua nota agora"
          title="Score atual"
          value={lastScore ? lastScore.final_score.toFixed(1) : "—"}
          delta={scoreDelta != null ? `${scoreDelta >= 0 ? "+" : ""}${scoreDelta.toFixed(1)} vs mês anterior` : undefined}
          deltaDirection={scoreDelta == null ? "flat" : scoreDelta > 0 ? "up" : scoreDelta < 0 ? "down" : "flat"}
          narrativa={scoreNarrativa}
          icon={Trophy}
          tone="primary"
          helpKey="score"
          onClick={() => navigate("/meu-score")}
        />
        <KpiCard
          pergunta="Quanto você vai ganhar?"
          title="Bônus projetado"
          value="—"
          narrativa="Cálculo em desenvolvimento."
          icon={DollarSign}
          tone="muted"
          helpKey="bonus"
        />
      </div>

      <RecomendacoesDoDia />

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

      {mode === "completo" && (
        <>
          <CompromissosCalendario />
          <DesenvolvimentoPessoal />
          <AlertasRiscos alertas={[]} />
        </>
      )}

      <div className="lg:hidden">
        <ComunicacaoBar />
      </div>

      <FabRapido />
    </div>
  );
}
