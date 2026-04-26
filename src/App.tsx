import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { PushPermission } from "@/components/PushPermission";
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
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { session, profile, loading } = useAuth();

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (profile?.must_change_password) return <Navigate to="/trocar-senha" replace />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/colaboradores" element={<Colaboradores />} />
        <Route path="/colaboradores/:id" element={<ColaboradorPerfil />} />
        <Route path="/meu-perfil" element={<MeuPerfil />} />
        <Route path="/advertencias" element={<Advertencias />} />
        <Route path="/suspensoes" element={<Suspensoes />} />
        <Route path="/departamentos" element={<Departamentos />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/assistente" element={<Assistente />} />
        <Route path="/rh/codigo-etica" element={<CodigoEtica />} />
        <Route path="/rh/cartilha" element={<CartilhaOperacional />} />
        <Route path="/rh/politicas" element={<PoliticasInternas />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/endomarketing" element={<EndomarketingPage />} />
        <Route path="/avisos" element={<Avisos />} />
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
        <Route path="/bo-eletronico" element={<BoEletronico />} />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

function AuthRoute() {
  const { session, profile, loading } = useAuth();
  if (loading) return null;
  if (session && !profile) return null;
  if (session) return <Navigate to={profile?.must_change_password ? "/trocar-senha" : "/"} replace />;
  return <Login />;
}

function ChangePasswordRoute() {
  const { session, profile, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return null;
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
