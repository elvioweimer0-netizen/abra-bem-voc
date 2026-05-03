import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { AvisosBanner } from "@/components/AvisosBanner";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Camera, MessageCircle, Sparkles, Users } from "lucide-react";
import { TopCuriosMes } from "@/components/TopCuriosMes";
import { CulturePillCard } from "@/components/culture/CulturePillCard";
import { useTodayPill } from "@/hooks/useCulturePills";
import type { Noticia } from "@/types/database";

type TeamMate = { id: string; nome: string; cargo_titulo: string | null; cargo: string };

const shortcuts = [
  { label: "Falar com RH", href: "/central-adm/rh", icon: MessageCircle, color: "bg-rose-500" },
  { label: "Documentos", href: "/rh/cartilha", icon: BookOpen, color: "bg-amber-500" },
  { label: "Galeria do Curió", href: "/galeria", icon: Camera, color: "bg-emerald-500" },
  { label: "Curiózinho", href: "/assistente", icon: Sparkles, color: "bg-violet-500" },
];

export default function FeedColaborador() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { isLiderSetor } = useRole();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [equipe, setEquipe] = useState<TeamMate[]>([]);
  const { data: todayPill } = useTodayPill();

  const firstName = profile?.nome?.split(" ")[0] ?? "time Curió";

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("noticias")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setNoticias((data as Noticia[]) ?? []));

    if (isLiderSetor && profile.id) {
      (supabase as any)
        .from("profiles")
        .select("id, nome, cargo, cargo_titulo")
        .eq("lider_setor_id", profile.id)
        .eq("ativo", true)
        .then(({ data }: any) => setEquipe(data ?? []));
    }
  }, [profile, isLiderSetor]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Bem-vindo de volta</p>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Olá, {firstName} 👋</h1>
      </div>

      <AvisosBanner />

      {todayPill && <CulturePillCard pill={todayPill} variant="compact" />}

      <TopCuriosMes />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Atalhos rápidos</h2>
        <div className="grid grid-cols-2 gap-3">
          {shortcuts.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.href)}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left card-shadow transition-all hover:border-primary hover:shadow-md"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${s.color} text-white shrink-0`}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-foreground">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isLiderSetor && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Users className="h-5 w-5 text-primary" /> Minha Equipe
          </h2>
          {equipe.length === 0 ? (
            <Card><CardContent className="p-4 text-sm text-muted-foreground">Nenhum colaborador vinculado a você ainda.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {equipe.map((m) => (
                <Card key={m.id} className="card-shadow">
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{m.nome}</p>
                      <p className="text-xs text-muted-foreground">{m.cargo_titulo ?? m.cargo}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">Ativo</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Notícias recentes</h2>
        {noticias.length === 0 ? (
          <Card><CardContent className="p-4 text-sm text-muted-foreground">Nenhuma notícia por enquanto.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {noticias.map((n) => (
              <button
                key={n.id}
                onClick={() => navigate("/noticias")}
                className="text-left rounded-xl border border-border bg-card p-4 card-shadow transition-all hover:border-primary"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </p>
                  {n.importante && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Importante</span>}
                </div>
                <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{n.titulo}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.conteudo}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
