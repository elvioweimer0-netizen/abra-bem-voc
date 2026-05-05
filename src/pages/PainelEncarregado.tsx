import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyEncarregadoScore } from "@/hooks/useEncarregadoScore";
import { HeaderSaudacao } from "@/components/painel/HeaderSaudacao";
import { KpiCard } from "@/components/painel/KpiCard";
import { AcoesRapidasPainel } from "@/components/painel/AcoesRapidasPainel";
import { AreaOperacional } from "@/components/painel/AreaOperacional";
import { EquipeOverview } from "@/components/painel/EquipeOverview";
import { LinhaDoTempoArea } from "@/components/painel/LinhaDoTempoArea";
import { PedidoDoGerente } from "@/components/painel/PedidoDoGerente";
import { DesenvolvimentoPessoal } from "@/components/painel/DesenvolvimentoPessoal";
import { ComunicacaoBar } from "@/components/painel/ComunicacaoBar";
import { ClipboardCheck, Target, Trophy, PackageX, Repeat, AlertTriangle, Sun } from "lucide-react";

export default function PainelEncarregado() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: scores = [] } = useMyEncarregadoScore();
  const lastScore = scores[0];

  return (
    <div className="space-y-5 pb-20 lg:pb-5">
      <HeaderSaudacao
        subtitle={`Encarregado · ${profile?.unidade ?? ""}`}
      />

      <div className="grid grid-cols-3 gap-3">
        <KpiCard title="Checklist da área" value="—" icon={ClipboardCheck} onClick={() => navigate("/checklist-diario")} />
        <KpiCard title="Meta da área" value="—" icon={Target} tone="muted" />
        <KpiCard
          title="Meu score"
          value={lastScore ? lastScore.score.toFixed(1) : "—"}
          hint={lastScore ? `${lastScore.month}/${lastScore.year}` : undefined}
          icon={Trophy}
          tone="primary"
        />
      </div>

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

      <LinhaDoTempoArea />

      <DesenvolvimentoPessoal />

      <div className="lg:hidden">
        <ComunicacaoBar />
      </div>
    </div>
  );
}
