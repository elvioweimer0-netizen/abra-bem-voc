import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { StatCard } from "@/components/StatCard";
import { AvisosBanner } from "@/components/AvisosBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, AlertTriangle, Ban, Wrench, Megaphone, Heart, Gift, Star,
  MessageCircle, Calendar, FileText, Headphones, ClipboardList, Video,
} from "lucide-react";
import type { Noticia, Endomarketing } from "@/types/database";
import { endomarketingTipoLabels } from "@/types/database";

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
      const [news, endo, msgs, ...countQueries] = await Promise.all([
        supabase.from("noticias").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("endomarketing").select("*").neq("tipo", "mensagem").order("data", { ascending: false }).limit(6),
        supabase.from("endomarketing").select("*").eq("tipo", "mensagem").order("data", { ascending: false }).limit(3),
        ...(isGestao ? [
          supabase.from("colaboradores").select("id", { count: "exact", head: true }),
          supabase.from("advertencias").select("id", { count: "exact", head: true }),
          supabase.from("suspensoes").select("id", { count: "exact", head: true }),
          supabase.from("ocorrencias").select("id", { count: "exact", head: true }),
        ] : []),
      ]);

      if (isGestao && countQueries.length === 4) {
        const [colabs, advs, susps, ocors] = countQueries;
        setCounts({
          colaboradores: colabs.count || 0,
          advertencias: advs.count || 0,
          suspensoes: susps.count || 0,
          ocorrencias: ocors.count || 0,
        });
      }

      setNoticias(news.data || []);
      setEndomarketing((endo.data as Endomarketing[]) || []);
      setMensagens((msgs.data as Endomarketing[]) || []);
    };

    fetchData();
  }, [profile, isGestao]);

  const endoIcon = (tipo: string) => {
    switch (tipo) {
      case "aniversario": return <Gift className="w-4 h-4 text-pink-500" />;
      case "destaque": return <Star className="w-4 h-4 text-amber-500" />;
      case "campanha": return <Megaphone className="w-4 h-4 text-primary" />;
      default: return <Heart className="w-4 h-4 text-rose-500" />;
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const heroBanner = noticias.find((n) => n.importante) || noticias[0];

  const quickActions = [
    { label: "Ver Notícias", icon: Megaphone, href: "/noticias", color: "bg-primary/10 text-primary" },
    { label: "Endomarketing", icon: Heart, href: "/endomarketing", color: "bg-rose-500/10 text-rose-500" },
    { label: "Avisos", icon: ClipboardList, href: "/avisos", color: "bg-amber-500/10 text-amber-500" },
    { label: "Assistente IA", icon: Headphones, href: "/assistente", color: "bg-success/10 text-success" },
  ];

  return (
    <div className="space-y-6">
      {/* TOPO — Boas-vindas */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bem-vindo, {profile?.nome?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            {profile?.unidade} · <span className="capitalize">{formattedDate}</span>
          </p>
        </div>
      </div>

      {/* Avisos urgentes */}
      <AvisosBanner />

      {/* SEÇÃO 1 — Banner destaque */}
      {heroBanner && (
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground card-shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-2 mb-2">
              <Megaphone className="w-5 h-5 mt-0.5 shrink-0" />
              <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-xs">
                {heroBanner.importante ? "Destaque" : "Informativo"}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{heroBanner.titulo}</h2>
            <p className="text-primary-foreground/85 text-sm sm:text-base line-clamp-3">
              {heroBanner.conteudo}
            </p>
            <p className="text-primary-foreground/60 text-xs mt-4">
              {new Date(heroBanner.created_at).toLocaleDateString("pt-BR")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cards de gestão (apenas para gestores) */}
      {isGestao && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Colaboradores" value={counts.colaboradores} icon={Users} color="primary" />
          <StatCard title="Advertências" value={counts.advertencias} icon={AlertTriangle} color="warning" />
          <StatCard title="Suspensões" value={counts.suspensoes} icon={Ban} color="destructive" />
          <StatCard title="Ocorrências" value={counts.ocorrencias} icon={Wrench} color="success" />
        </div>
      )}

      {/* SEÇÃO 5 — Ações Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <a key={action.label} href={action.href}>
            <Card className="card-shadow hover:card-shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEÇÃO 2 — Informativo do Mercado */}
        <Card className="card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="w-5 h-5 text-primary" />
              Informativo do Mercado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {noticias.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma notícia no momento.</p>
            ) : (
              <div className="space-y-3">
                {noticias.map((n) => (
                  <div key={n.id} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm">{n.titulo}</h3>
                      <div className="flex gap-1 shrink-0">
                        {n.importante && (
                          <Badge variant="destructive" className="text-xs">Importante</Badge>
                        )}
                        {n.unidade ? (
                          <Badge variant="outline" className="text-xs">{n.unidade}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Geral</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.conteudo}</p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      {new Date(n.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 3 — Endomarketing */}
        <Card className="card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="w-5 h-5 text-rose-500" />
              Endomarketing
            </CardTitle>
          </CardHeader>
          <CardContent>
            {endomarketing.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhum conteúdo de endomarketing.</p>
            ) : (
              <div className="space-y-3">
                {endomarketing.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <div className="mt-0.5">{endoIcon(e.tipo)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{e.titulo}</h3>
                        <Badge variant="outline" className="text-xs">
                          {endomarketingTipoLabels[e.tipo]}
                        </Badge>
                      </div>
                      {e.descricao && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.descricao}</p>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {new Date(e.data).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 4 — Mensagem ao Colaborador */}
      {mensagens.length > 0 && (
        <Card className="card-shadow border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5 text-primary" />
              Mensagem ao Colaborador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mensagens.map((m) => (
                <div key={m.id} className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <h3 className="font-semibold text-sm text-foreground">{m.titulo}</h3>
                  {m.descricao && (
                    <p className="text-sm text-muted-foreground mt-1">{m.descricao}</p>
                  )}
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    {new Date(m.data).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
