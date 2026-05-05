import { HeaderMaster } from "@/components/master/HeaderMaster";
import { KpiRedeBar } from "@/components/master/KpiRedeBar";
import { CurioMasterFalante } from "@/components/master/CurioMasterFalante";
import { UnidadesGrid } from "@/components/master/UnidadesGrid";
import { GerentesTabela } from "@/components/master/GerentesTabela";
import { AlertasCriticosRede } from "@/components/master/AlertasCriticosRede";
import { DecisoesPendentes } from "@/components/master/DecisoesPendentes";
import { SolicitacoesQuadroPendentes } from "@/components/master/SolicitacoesQuadroPendentes";
import { AcoesMaster } from "@/components/master/AcoesMaster";
import { InsightsDaSemana } from "@/components/master/InsightsDaSemana";
import { AgendaSemanaWidget } from "@/components/master/AgendaSemanaWidget";
import { RankingUnidades } from "@/components/master/RankingUnidades";
import { QuemVoceNaoFalaWidget } from "@/components/master/QuemVoceNaoFalaWidget";
import { PerguntaProCurio } from "@/components/master/PerguntaProCurio";
import { RelatorioSemanalButton } from "@/components/master/RelatorioSemanalButton";

export default function PainelMaster() {
  return (
    <div className="space-y-5 pb-24 lg:pb-5">
      <HeaderMaster />
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <KpiRedeBar />
      </div>
      <CurioMasterFalante />
      <UnidadesGrid />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GerentesTabela />
        <div className="space-y-4">
          <AlertasCriticosRede />
          <DecisoesPendentes />
        </div>
      </div>
      <AcoesMaster />
      <RelatorioSemanalButton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InsightsDaSemana />
        <QuemVoceNaoFalaWidget />
        <AgendaSemanaWidget />
      </div>
      <RankingUnidades />
      <PerguntaProCurio />
    </div>
  );
}
