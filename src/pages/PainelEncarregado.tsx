import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyEncarregadoScore } from "@/hooks/useEncarregadoScore";
import { usePainelMode } from "@/hooks/usePainelMode";
import { HeaderSaudacao } from "@/components/painel/HeaderSaudacao";
import { KpiCard } from "@/components/painel/KpiCard";
import { AcoesRapidasPainel } from "@/components/painel/AcoesRapidasPainel";
import { AreaOperacional } from "@/components/painel/AreaOperacional";
import { EquipeOverview } from "@/components/painel/EquipeOverview";
import { LinhaDoTempoArea } from "@/components/painel/LinhaDoTempoArea";
import { PedidoDoGerente } from "@/components/painel/PedidoDoGerente";
import { DesenvolvimentoPessoal } from "@/components/painel/DesenvolvimentoPessoal";
import { ComunicacaoBar } from "@/components/painel/ComunicacaoBar";
import { RecomendacoesDoDia } from "@/components/painel/RecomendacoesDoDia";
import { PainelOnboarding } from "@/components/painel/PainelOnboarding";
import { FabRapido } from "@/components/painel/FabRapido";
import { ClipboardCheck, Target, Trophy, PackageX, Repeat, AlertTriangle, Sun } from "lucide-react";

export default function PainelEncarregado() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { mode } = usePainelMode();
  const { data: scores = [] } = useMyEncarregadoScore();
  const lastScore = scores[0];

  const scoreNarrativa = lastScore
    ? `Sua nota: ${lastScore.score.toFixed(1)} (${lastScore.month}/${lastScore.year}).`
    : "Aguardando primeira avaliação.";

  const resumoTexto = `${scoreNarrativa}. Lembre de fechar o checklist da área hoje.`;

  return (
    <div className="space-y-5 pb-24 lg:pb-5">
      <PainelOnboarding />

      <HeaderSaudacao
        subtitle={`Encarregado · ${profile?.unidade ?? ""}`}
        resumoTexto={resumoTexto}
      />

      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          pergunta="Sua área tá em dia?"
          title="Checklist da área"
          value="—"
          icon={ClipboardCheck}
          helpKey="checklist_area"
          onClick={() => navigate("/checklist-diario")}
        />
        <KpiCard
          pergunta="Meta da sua área"
          title="Meta da área"
          value="—"
          icon={Target}
          tone="muted"
          helpKey="meta_area"
        />
        <KpiCard
          pergunta="Sua nota agora"
          title="Meu score"
          value={lastScore ? lastScore.score.toFixed(1) : "—"}
          narrativa={scoreNarrativa}
          icon={Trophy}
          tone="primary"
          helpKey="score"
        />
      </div>

      <RecomendacoesDoDia />

      <AcoesRapidasPainel
        acoes={[
          { label: "+ Produto faltando", icon: PackageX, onClick: () => navigate("/produtos-faltando") },
          { label: "+ Reposição", icon: Repeat, onClick: () => navigate("/reposicao") },
          { label: "+ Incidente", icon: AlertTriangle, onClick: () => navigate("/seguranca"), tone: "bg-destructive/10 text-destructive" },
          { label: "Iniciar turno", icon: Sun, onClick: () => navigate("/") },
        ]}
      />

      <PedidoDoGerente />

      <AreaOperacional />

      <EquipeOverview title="Minha equipe direta" />

      {mode === "completo" && (
        <>
          <LinhaDoTempoArea />
          <DesenvolvimentoPessoal />
        </>
      )}

      <div className="lg:hidden">
        <ComunicacaoBar />
      </div>

      <FabRapido />
    </div>
  );
}
