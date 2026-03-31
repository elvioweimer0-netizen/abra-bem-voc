import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/StatCard";
import { AvisosBanner } from "@/components/AvisosBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, Ban, Wrench, Megaphone, Heart, Gift, Star } from "lucide-react";
import type { Noticia, Endomarketing } from "@/types/database";
import { endomarketingTipoLabels } from "@/types/database";

export default function Dashboard() {
  const { profile } = useAuth();
  const [counts, setCounts] = useState({ colaboradores: 0, advertencias: 0, suspensoes: 0, ocorrencias: 0 });
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [endomarketing, setEndomarketing] = useState<Endomarketing[]>([]);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      const [colabs, advs, susps, ocors, news, endo] = await Promise.all([
        supabase.from("colaboradores").select("id", { count: "exact", head: true }),
        supabase.from("advertencias").select("id", { count: "exact", head: true }),
        supabase.from("suspensoes").select("id", { count: "exact", head: true }),
        supabase.from("ocorrencias").select("id", { count: "exact", head: true }),
        supabase.from("noticias").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("endomarketing").select("*").order("data", { ascending: false }).limit(6),
      ]);

      setCounts({
        colaboradores: colabs.count || 0,
        advertencias: advs.count || 0,
        suspensoes: susps.count || 0,
        ocorrencias: ocors.count || 0,
      });
      setNoticias(news.data || []);
      setEndomarketing((endo.data as Endomarketing[]) || []);
    };

    fetchData();
  }, [profile]);

  const endoIcon = (tipo: string) => {
    switch (tipo) {
      case "aniversario": return <Gift className="w-4 h-4 text-pink-500" />;
      case "destaque": return <Star className="w-4 h-4 text-amber-500" />;
      case "campanha": return <Megaphone className="w-4 h-4 text-primary" />;
      default: return <Heart className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Curió Conecta</h1>
        <p className="text-muted-foreground">Bem-vindo, {profile?.nome}!</p>
      </div>

      {/* Avisos urgentes no topo */}
      <AvisosBanner />

      {/* Cards rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Colaboradores" value={counts.colaboradores} icon={Users} color="primary" />
        <StatCard title="Advertências" value={counts.advertencias} icon={AlertTriangle} color="warning" />
        <StatCard title="Suspensões" value={counts.suspensoes} icon={Ban} color="destructive" />
        <StatCard title="Ocorrências" value={counts.ocorrencias} icon={Wrench} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informativo do Mercado */}
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

        {/* Endomarketing */}
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
    </div>
  );
}
