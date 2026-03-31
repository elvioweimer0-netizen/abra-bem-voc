import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Colaboradores from "@/pages/Colaboradores";
import ColaboradorPerfil from "@/pages/ColaboradorPerfil";
import Advertencias from "@/pages/Advertencias";
import Suspensoes from "@/pages/Suspensoes";
import Departamentos from "@/pages/Departamentos";
import Relatorios from "@/pages/Relatorios";
import Assistente from "@/pages/Assistente";
import Noticias from "@/pages/Noticias";
import EndomarketingPage from "@/pages/EndomarketingPage";
import Avisos from "@/pages/Avisos";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/colaboradores" element={<Colaboradores />} />
        <Route path="/colaboradores/:id" element={<ColaboradorPerfil />} />
        <Route path="/advertencias" element={<Advertencias />} />
        <Route path="/suspensoes" element={<Suspensoes />} />
        <Route path="/departamentos" element={<Departamentos />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/assistente" element={<Assistente />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/endomarketing" element={<EndomarketingPage />} />
        <Route path="/avisos" element={<Avisos />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

function AuthRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <Login />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<AuthRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
