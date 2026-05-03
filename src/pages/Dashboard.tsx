import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { AvisosBanner } from "@/components/AvisosBanner";
import { HeaderHome } from "@/components/dashboard/HeaderHome";
import { BannerPrincipal } from "@/components/dashboard/BannerPrincipal";
import { InformativoMercado } from "@/components/dashboard/InformativoMercado";
import { EndomarketingSection } from "@/components/dashboard/EndomarketingSection";
import { MensagemColaborador } from "@/components/dashboard/MensagemColaborador";
import { AcoesRapidas } from "@/components/dashboard/AcoesRapidas";
import { CardsAdministrativos } from "@/components/dashboard/CardsAdministrativos";
import { HojeNoCurio } from "@/components/dashboard/HojeNoCurio";
import { MomentosCurio } from "@/components/dashboard/MomentosCurio";
import { MissaoVisaoValores } from "@/components/dashboard/MissaoVisaoValores";
import { CuriozinhoHomeCard } from "@/components/curiozinho";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock, CheckCircle2, ClipboardList, Gauge, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Noticia, Endomarketing } from "@/types/database";
import FeedColaborador from "@/pages/FeedColaborador";
import { CommitmentsWidget } from "@/components/commitments/CommitmentsWidget";
import { CulturePillCard } from "@/components/culture/CulturePillCard";
import { useTodayPill } from "@/hooks/useCulturePills";

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { isGerente, isAdmin, isSupervisor, isEncarregado, isGerenteAdm, isColaborador, isFeedUser } = useRole();
  if (isFeedUser) return <FeedColaborador />;
  const showAdminMetrics = isGerente || isAdmin;
  const [counts, setCounts] = useState({ colaboradores: 0, advertencias: 0, suspensoes: 0, ocorrencias: 0 });
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [endomarketing, setEndomarketing] = useState<Endomarketing[]>([]);
  const [mensagens, setMensagens] = useState<Endomarketing[]>([]);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      const basePromises = [
        supabase.from("noticias").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("endomarketing").select("*").neq("tipo", "mensagem").order("data", { ascending: false }).limit(6),
        supabase.from("endomarketing").select("*").eq("tipo", "mensagem").order("data", { ascending: false }).limit(3),
      ] as const;

      const gestaoPromises = showAdminMetrics ? [
        supabase.from("colaboradores").select("id", { count: "exact", head: true }),
        supabase.from("advertencias").select("id", { count: "exact", head: true }),
        supabase.from("suspensoes").select("id", { count: "exact", head: true }),
        supabase.from("ocorrencias").select("id", { count: "exact", head: true }),
      ] as const : [];

      const [news, endo, msgs, ...countResults] = await Promise.all([...basePromises, ...gestaoPromises]);

      setNoticias(news.data || []);
      setEndomarketing((endo.data as Endomarketing[]) || []);
      setMensagens((msgs.data as Endomarketing[]) || []);

      if (showAdminMetrics && countResults.length === 4) {
        setCounts({
          colaboradores: countResults[0].count || 0,
          advertencias: countResults[1].count || 0,
          suspensoes: countResults[2].count || 0,
          ocorrencias: countResults[3].count || 0,
        });
      }
    };

    fetchData();
  }, [profile, showAdminMetrics]);

  const heroBanner = noticias.find((n) => n.importante) || noticias[0];
  const firstName = profile?.nome?.split(" ")[0] || "time Curió";

  const profileCards = isAdmin
    ? ["Ranking das unidades hoje", "Ocorrências urgentes da rede", "Resumo financeiro semanal"]
    : isSupervisor
      ? ["Agenda de visitas do dia", "Status das 6 unidades", "Próxima inspeção sugerida"]
      : isGerenteAdm
        ? ["Atalho para sua gerência", "Mensagens das lojas", "Pendências da área"]
        : isGerente
          ? ["Checklist da unidade", "Ocorrências abertas", "Reunião 9:30"]
          : isEncarregado
            ? ["Pendências do setor", "Próxima reunião", "Faltas e ocorrências"]
            : ["Sua escala", "Avisos importantes", "Elogios recentes"];

  const mainAction = isAdmin
    ? { label: "Visão Geral Completa", href: "/visao-geral-admin" }
    : isSupervisor
      ? { label: "Ver Minhas Unidades", href: "/minhas-unidades" }
      : isGerenteAdm
        ? { label: "Abrir Minha Gerência", href: "/central-adm/rh" }
        : isColaborador
          ? { label: "Ver minha agenda", href: "/escala-semana" }
          : { label: "Iniciar Reunião 9:30", href: "/reunioes-lideranca" };

  return (
    <div className="space-y-6 md:space-y-8">
      <HeaderHome />
      <Card className="border-border card-shadow">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Bom dia, {firstName}</p>
              <h2 className="mt-1 text-xl font-bold text-foreground">{isAdmin ? "Visão consolidada da rede" : isSupervisor ? "Operação das unidades hoje" : isGerenteAdm ? "Central ADM" : "Rotina de loja"}</h2>
            </div>
            <Button onClick={() => navigate(mainAction.href)}>{mainAction.label}</Button>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {profileCards.map((label, index) => {
              const Icon = [ClipboardList, Gauge, CalendarClock][index] || CheckCircle2;
              return (
                <div key={label} className="rounded-lg border border-border bg-muted/40 p-3">
                  <Icon className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="mt-1 text-xs text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />{isAdmin || isSupervisor ? "Todas as unidades" : profile?.unidade}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <AvisosBanner />
      <CommitmentsWidget />
      <BannerPrincipal noticia={heroBanner} />
      <MensagemColaborador mensagens={mensagens} />

      {showAdminMetrics && <CardsAdministrativos counts={counts} />}

      <CuriozinhoHomeCard />
      <AcoesRapidas />

      <MissaoVisaoValores />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InformativoMercado noticias={noticias} />
        <EndomarketingSection items={endomarketing} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HojeNoCurio />
        <MomentosCurio />
      </div>
    </div>
  );
}
