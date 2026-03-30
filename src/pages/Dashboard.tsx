import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, Ban, Wrench, Megaphone, AlertCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Noticia = Tables<"noticias">;

export default function Dashboard() {
  const { profile } = useAuth();
  const [counts, setCounts] = useState({ colaboradores: 0, advertencias: 0, suspensoes: 0, ocorrencias: 0 });
  const [noticias, setNoticias] = useState<Noticia[]>([]);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      const [colabs, advs, susps, ocors, news] = await Promise.all([
        supabase.from("colaboradores").select("id", { count: "exact", head: true }),
        supabase.from("advertencias").select("id", { count: "exact", head: true }),
        supabase.from("suspensoes").select("id", { count: "exact", head: true }),
        supabase.from("ocorrencias").select("id", { count: "exact", head: true }),
        supabase.from("noticias").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      setCounts({
        colaboradores: colabs.count || 0,
        advertencias: advs.count || 0,
        suspensoes: susps.count || 0,
        ocorrencias: ocors.count || 0,
      });
      setNoticias(news.data || []);
    };

    fetchData();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo, {profile?.nome}!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Colaboradores" value={counts.colaboradores} icon={Users} color="primary" />
        <StatCard title="Advertências" value={counts.advertencias} icon={AlertTriangle} color="warning" />
        <StatCard title="Suspensões" value={counts.suspensoes} icon={Ban} color="destructive" />
        <StatCard title="Ocorrências" value={counts.ocorrencias} icon={Wrench} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="w-5 h-5 text-primary" />
              Notícias Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {noticias.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma notícia encontrada.</p>
            ) : (
              <div className="space-y-3">
                {noticias.map((n) => (
                  <div key={n.id} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm">{n.titulo}</h3>
                      {n.importante && (
                        <Badge variant="destructive" className="shrink-0 text-xs">Importante</Badge>
                      )}
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

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-warning" />
              Avisos Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {noticias.filter((n) => n.importante).length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum aviso importante.</p>
            ) : (
              <div className="space-y-3">
                {noticias.filter((n) => n.importante).map((n) => (
                  <div key={n.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <h3 className="font-medium text-sm">{n.titulo}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{n.conteudo}</p>
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
