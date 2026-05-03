import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { PushPermission } from "@/components/PushPermission";
import { Button } from "@/components/ui/button";
import Login from "@/pages/Login";
import TrocarSenha from "@/pages/TrocarSenha";
import Dashboard from "@/pages/Dashboard";
import Colaboradores from "@/pages/Colaboradores";
import ColaboradorPerfil from "@/pages/ColaboradorPerfil";
import MeuPerfil from "@/pages/MeuPerfil";
import Advertencias from "@/pages/Advertencias";
import Suspensoes from "@/pages/Suspensoes";
import Departamentos from "@/pages/Departamentos";
import Relatorios from "@/pages/Relatorios";
import Assistente from "@/pages/Assistente";
import CodigoEtica from "@/pages/CodigoEtica";
import CartilhaOperacional from "@/pages/CartilhaOperacional";
import PoliticasInternas from "@/pages/PoliticasInternas";
import Noticias from "@/pages/Noticias";
import EndomarketingPage from "@/pages/EndomarketingPage";
import Avisos from "@/pages/Avisos";
import AvisoDetalhe from "@/pages/AvisoDetalhe";
import Galeria from "@/pages/Galeria";
import Reunioes from "@/pages/Reunioes";
import CriarReuniao from "@/pages/CriarReuniao";
import AgendaReunioes from "@/pages/AgendaReunioes";
import HistoricoReunioes from "@/pages/HistoricoReunioes";
import GestaoUsuarios from "@/pages/GestaoUsuarios";
import GerenciaPage from "@/pages/GerenciaPage";
import ChecklistDiario from "@/pages/ChecklistDiario";
import PainelCobranca from "@/pages/PainelCobranca";
import ReunioesLideranca from "@/pages/ReunioesLideranca";
import BoEletronico from "@/pages/BoEletronico";
import Inspecoes from "@/pages/Inspecoes";
import VisaoGeralAdmin from "@/pages/VisaoGeralAdmin";
import MinhaEquipe from "@/pages/MinhaEquipe";
import MinhasUnidades from "@/pages/MinhasUnidades";
import MembroDetalhe from "@/pages/MembroDetalhe";
import EscalaSemana from "@/pages/EscalaSemana";
import AvaliacoesEncarregados from "@/pages/AvaliacoesEncarregados";
import Reconhecimentos from "@/pages/Reconhecimentos";
import CentralAdmPlaceholder from "@/pages/CentralAdmPlaceholder";
import DocumentosLideranca from "@/pages/DocumentosLideranca";
import CurioDeOuroPage from "@/pages/CurioDeOuroPage";
import MapaVisitas from "@/pages/MapaVisitas";
import HistoricoVisitas from "@/pages/HistoricoVisitas";
import Treinamento from "@/pages/Treinamento";
import TreinamentoDetalhe from "@/pages/TreinamentoDetalhe";
import PerfilTreinamentos from "@/pages/PerfilTreinamentos";
import AdminTreinamento from "@/pages/AdminTreinamento";
import UnidadePage from "@/pages/UnidadePage";
import UnidadesIndex from "@/pages/UnidadesIndex";
import Clima from "@/pages/Clima";
import AdminClima from "@/pages/AdminClima";
import DailyHuddle from "@/pages/DailyHuddle";
import DailyHuddlePainel from "@/pages/DailyHuddlePainel";
import Compromissos from "@/pages/Compromissos";
import CompromissosBoard from "@/pages/CompromissosBoard";
import Cultura from "@/pages/Cultura";
import CulturaValor from "@/pages/CulturaValor";
import AdminCultura from "@/pages/AdminCultura";
import MinhasConquistas from "@/pages/MinhasConquistas";
import ConquistasRanking from "@/pages/ConquistasRanking";
import AdminConquistas from "@/pages/AdminConquistas";
import Caderno from "@/pages/Caderno";
import CadernoArtigo from "@/pages/CadernoArtigo";
import AdminCaderno from "@/pages/AdminCaderno";
import PerguntaSemana from "@/pages/PerguntaSemana";
import PerguntaSemanaHistorico from "@/pages/PerguntaSemanaHistorico";
import PerguntaSemanaDetalhe from "@/pages/PerguntaSemanaDetalhe";
import AdminPerguntaSemana from "@/pages/AdminPerguntaSemana";
import MeusStories from "@/pages/MeusStories";
import AdminStories from "@/pages/AdminStories";
import Heatmap from "@/pages/Heatmap";
import Pdi from "@/pages/Pdi";
import PdiEquipe from "@/pages/PdiEquipe";
import PdiAdmin from "@/pages/PdiAdmin";
import AuditoriaVisual from "@/pages/AuditoriaVisual";
import Historias from "@/pages/Historias";
import HistoriasHallDoMes from "@/pages/HistoriasHallDoMes";
import AdminHistorias from "@/pages/AdminHistorias";
import Onboarding from "@/pages/Onboarding";
import AdminOnboarding from "@/pages/AdminOnboarding";
import MeuScore from "@/pages/MeuScore";
import ScoresRanking from "@/pages/ScoresRanking";
import AdminScoreDimensions from "@/pages/AdminScoreDimensions";
import { AchievementUnlockListener } from "@/components/achievements/AchievementUnlockListener";
import { useIsRhAdmin } from "@/hooks/useIsRhAdmin";
import type { ReactNode } from "react";
import NotFound from "@/pages/NotFound";
import { useRole } from "@/hooks/useRole";

function LeaderOnly({ children }: { children: ReactNode }) {
  const { isLider } = useRole();
  if (!isLider) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useRole();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function SupervisorOnly({ children }: { children: ReactNode }) {
  const { isAdmin, isSupervisor } = useRole();
  if (!isAdmin && !isSupervisor) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RhAdminOnly({ children }: { children: ReactNode }) {
  const isRh = useIsRhAdmin();
  if (!isRh) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function HeatmapAccess({ children }: { children: ReactNode }) {
  const { cargo } = useRole();
  const allowed = ["master", "admin", "supervisor", "gerente_adm"].includes(cargo);
  if (!allowed) return <NotFound />;
  return <>{children}</>;
}

function PdiTeamAccess({ children }: { children: ReactNode }) {
  const { cargo } = useRole();
  const allowed = ["master", "admin", "supervisor", "gerente_loja", "gerente", "encarregado"].includes(cargo);
  if (!allowed) return <NotFound />;
  return <>{children}</>;
}

function PdiAdminAccess({ children }: { children: ReactNode }) {
  const { cargo } = useRole();
  const allowed = ["master", "admin", "supervisor"].includes(cargo);
  if (!allowed) return <NotFound />;
  return <>{children}</>;
}

function AuditoriaAccess({ children }: { children: ReactNode }) {
  const { cargo } = useRole();
  const allowed = ["master", "admin", "supervisor", "gerente_adm"].includes(cargo);
  if (!allowed) return <NotFound />;
  return <>{children}</>;
}

function MyScoreAccess({ children }: { children: ReactNode }) {
  const { cargo } = useRole();
  const allowed = ["gerente_loja", "gerente_adm", "encarregado", "master", "admin", "supervisor"].includes(cargo);
  if (!allowed) return <NotFound />;
  return <>{children}</>;
}

function ScoresRankingAccess({ children }: { children: ReactNode }) {
  const { cargo } = useRole();
  const allowed = ["master", "admin", "supervisor"].includes(cargo);
  if (!allowed) return <NotFound />;
  return <>{children}</>;
}

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-foreground">Perfil não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua sessão está ativa, mas o perfil de acesso não carregou. Saia e entre novamente; se continuar, o usuário precisa ser revisado na gestão.
          </p>
          <Button className="mt-5 w-full" onClick={() => signOut()}>
            Sair e tentar novamente
          </Button>
        </div>
      </div>
    );
  }
  if (profile?.must_change_password) return <Navigate to="/trocar-senha" replace />;

  return (
    <AppLayout>
      <AchievementUnlockListener />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/colaboradores" element={<LeaderOnly><Colaboradores /></LeaderOnly>} />
        <Route path="/colaboradores/:id" element={<LeaderOnly><ColaboradorPerfil /></LeaderOnly>} />
        <Route path="/meu-perfil" element={<MeuPerfil />} />
        <Route path="/advertencias" element={<LeaderOnly><Advertencias /></LeaderOnly>} />
        <Route path="/suspensoes" element={<LeaderOnly><Suspensoes /></LeaderOnly>} />
        <Route path="/departamentos" element={<LeaderOnly><Departamentos /></LeaderOnly>} />
        <Route path="/relatorios" element={<LeaderOnly><Relatorios /></LeaderOnly>} />
        <Route path="/assistente" element={<Assistente />} />
        <Route path="/rh/codigo-etica" element={<CodigoEtica />} />
        <Route path="/rh/cartilha" element={<CartilhaOperacional />} />
        <Route path="/rh/politicas" element={<PoliticasInternas />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/endomarketing" element={<EndomarketingPage />} />
        <Route path="/avisos" element={<Avisos />} />
        <Route path="/avisos/:id" element={<AvisoDetalhe />} />
        <Route path="/galeria" element={<Galeria />} />
        <Route path="/reunioes" element={<Reunioes />} />
        <Route path="/reunioes/criar" element={<CriarReuniao />} />
        <Route path="/agenda" element={<AgendaReunioes />} />
        <Route path="/reunioes/historico" element={<HistoricoReunioes />} />
        <Route path="/gestao-usuarios" element={<GestaoUsuarios />} />
        <Route path="/gerencias/:slug" element={<GerenciaPage />} />
        <Route path="/checklist-diario" element={<ChecklistDiario />} />
        <Route path="/painel-cobranca" element={<PainelCobranca />} />
        <Route path="/reunioes-lideranca" element={<ReunioesLideranca />} />
        <Route path="/documentos-lideranca" element={<DocumentosLideranca />} />
        <Route path="/ocorrencias" element={<BoEletronico />} />
        <Route path="/bo-eletronico" element={<Navigate to="/ocorrencias" replace />} />
        <Route path="/inspecoes" element={<Inspecoes />} />
        <Route path="/visao-geral-admin" element={<VisaoGeralAdmin />} />
        <Route path="/minha-equipe" element={<MinhaEquipe />} />
        <Route path="/minhas-unidades" element={<MinhasUnidades />} />
        <Route path="/meu-setor" element={<MinhaEquipe setorOnly />} />
        <Route path="/equipe/:id" element={<MembroDetalhe />} />
        <Route path="/escala-semana" element={<EscalaSemana />} />
        <Route path="/avaliacoes" element={<AvaliacoesEncarregados />} />
        <Route path="/reconhecimentos" element={<Reconhecimentos />} />
        <Route path="/central-adm/:slug" element={<CentralAdmPlaceholder />} />
        <Route path="/curio-de-ouro" element={<CurioDeOuroPage />} />
        <Route path="/mapa-visitas" element={<SupervisorOnly><MapaVisitas /></SupervisorOnly>} />
        <Route path="/historico-visitas" element={<SupervisorOnly><HistoricoVisitas /></SupervisorOnly>} />
        <Route path="/treinamento" element={<Treinamento />} />
        <Route path="/treinamento/:id" element={<TreinamentoDetalhe />} />
        <Route path="/perfil/treinamentos" element={<PerfilTreinamentos />} />
        <Route path="/admin/treinamento" element={<AdminTreinamento />} />
        <Route path="/unidades" element={<UnidadesIndex />} />
        <Route path="/unidade/:id" element={<UnidadePage />} />
        <Route path="/clima" element={<Clima />} />
        <Route path="/admin/clima" element={<AdminClima />} />
        <Route path="/daily-huddle" element={<LeaderOnly><DailyHuddle /></LeaderOnly>} />
        <Route path="/daily-huddle/painel" element={<SupervisorOnly><DailyHuddlePainel /></SupervisorOnly>} />
        <Route path="/compromissos" element={<LeaderOnly><Compromissos /></LeaderOnly>} />
        <Route path="/compromissos/board" element={<SupervisorOnly><CompromissosBoard /></SupervisorOnly>} />
        <Route path="/cultura" element={<Cultura />} />
        <Route path="/cultura/valor/:code" element={<CulturaValor />} />
        <Route path="/admin/cultura" element={<AdminCultura />} />
        <Route path="/perfil/conquistas" element={<MinhasConquistas />} />
        <Route path="/conquistas/ranking" element={<LeaderOnly><ConquistasRanking /></LeaderOnly>} />
        <Route path="/admin/conquistas" element={<AdminOnly><AdminConquistas /></AdminOnly>} />
        <Route path="/caderno" element={<LeaderOnly><Caderno /></LeaderOnly>} />
        <Route path="/caderno/:articleId" element={<LeaderOnly><CadernoArtigo /></LeaderOnly>} />
        <Route path="/admin/caderno" element={<RhAdminOnly><AdminCaderno /></RhAdminOnly>} />
        <Route path="/pergunta-semana" element={<LeaderOnly><PerguntaSemana /></LeaderOnly>} />
        <Route path="/pergunta-semana/historico" element={<LeaderOnly><PerguntaSemanaHistorico /></LeaderOnly>} />
        <Route path="/pergunta-semana/:questionId" element={<LeaderOnly><PerguntaSemanaDetalhe /></LeaderOnly>} />
        <Route path="/admin/pergunta-semana" element={<SupervisorOnly><AdminPerguntaSemana /></SupervisorOnly>} />
        <Route path="/perfil/stories" element={<MeusStories />} />
        <Route path="/admin/stories" element={<AdminOnly><AdminStories /></AdminOnly>} />
        <Route path="/heatmap" element={<HeatmapAccess><Heatmap /></HeatmapAccess>} />
        <Route path="/pdi" element={<Pdi />} />
        <Route path="/pdi/equipe" element={<PdiTeamAccess><PdiEquipe /></PdiTeamAccess>} />
        <Route path="/pdi/admin" element={<PdiAdminAccess><PdiAdmin /></PdiAdminAccess>} />
        <Route path="/auditoria-visual" element={<AuditoriaAccess><AuditoriaVisual /></AuditoriaAccess>} />
        <Route path="/historias" element={<Historias />} />
        <Route path="/historias/hall-do-mes" element={<HistoriasHallDoMes />} />
        <Route path="/admin/historias" element={<RhAdminOnly><AdminHistorias /></RhAdminOnly>} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/admin/onboarding" element={<RhAdminOnly><AdminOnboarding /></RhAdminOnly>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

function AuthRoute() {
  const { session, profile, loading } = useAuth();
  if (loading) return null;
  if (session && !profile) return <Navigate to="/" replace />;
  if (session) return <Navigate to={profile?.must_change_password ? "/trocar-senha" : "/"} replace />;
  return <Login />;
}

function ChangePasswordRoute() {
  const { session, profile, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/" replace />;
  return <TrocarSenha />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PushPermission />
          <PwaInstallPrompt />
          <Routes>
            <Route path="/login" element={<AuthRoute />} />
            <Route path="/trocar-senha" element={<ChangePasswordRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
