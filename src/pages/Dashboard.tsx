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
import type { Noticia, Endomarketing } from "@/types/database";

export default function Dashboard() {
  const { profile } = useAuth();
  const { isGestao } = useRole();
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

      const gestaoPromises = isGestao ? [
        supabase.from("colaboradores").select("id", { count: "exact", head: true }),
        supabase.from("advertencias").select("id", { count: "exact", head: true }),
        supabase.from("suspensoes").select("id", { count: "exact", head: true }),
        supabase.from("ocorrencias").select("id", { count: "exact", head: true }),
      ] as const : [];

      const [news, endo, msgs, ...countResults] = await Promise.all([...basePromises, ...gestaoPromises]);

      setNoticias(news.data || []);
      setEndomarketing((endo.data as Endomarketing[]) || []);
      setMensagens((msgs.data as Endomarketing[]) || []);

      if (isGestao && countResults.length === 4) {
        setCounts({
          colaboradores: countResults[0].count || 0,
          advertencias: countResults[1].count || 0,
          suspensoes: countResults[2].count || 0,
          ocorrencias: countResults[3].count || 0,
        });
      }
    };

    fetchData();
  }, [profile, isGestao]);

  const heroBanner = noticias.find((n) => n.importante) || noticias[0];

  return (
    <div className="space-y-6 md:space-y-8">
      <HeaderHome />
      <AvisosBanner />
      <BannerPrincipal noticia={heroBanner} />
      <MensagemColaborador mensagens={mensagens} />

      {isGestao && <CardsAdministrativos counts={counts} />}

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
