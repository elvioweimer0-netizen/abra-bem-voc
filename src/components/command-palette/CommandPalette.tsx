import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckSquare,
  ClipboardList,
  Compass,
  Eye,
  FileText,
  Flame,
  GraduationCap,
  Heart,
  LayoutDashboard,
  Megaphone,
  Plus,
  Sparkles,
  Star,
  Target,
  Tv,
  User,
  Users,
  Zap,
} from "lucide-react";

const STALE = 5 * 60 * 1000;

const PAGES: { label: string; path: string; icon: any; keywords?: string }[] = [
  { label: "Painel", path: "/visao-geral-admin", icon: LayoutDashboard, keywords: "dashboard home" },
  { label: "Clima", path: "/clima", icon: Heart },
  { label: "Compromissos", path: "/compromissos", icon: CheckSquare },
  { label: "Heatmap", path: "/heatmap", icon: Activity },
  { label: "Cultura", path: "/cultura", icon: Compass },
  { label: "Conquistas (Ranking)", path: "/conquistas/ranking", icon: Award },
  { label: "PDI", path: "/pdi", icon: Target },
  { label: "Auditoria Visual", path: "/auditoria-visual", icon: Eye },
  { label: "Histórias", path: "/historias", icon: BookOpen },
  { label: "Onboarding", path: "/onboarding", icon: GraduationCap },
  { label: "Meu Score", path: "/meu-score", icon: Star },
  { label: "Ranking de Scores", path: "/scores/ranking", icon: Star },
  { label: "TV Displays", path: "/admin/tv-displays", icon: Tv },
  { label: "Avisos", path: "/avisos", icon: Megaphone },
  { label: "Caderno", path: "/caderno", icon: FileText },
  { label: "Reuniões", path: "/reunioes", icon: Calendar },
  { label: "Treinamento", path: "/treinamento", icon: GraduationCap },
  { label: "Resumo WhatsApp", path: "/whatsapp-resumo", icon: Megaphone, keywords: "whatsapp zap resumo" },
];

const ACTIONS: { label: string; path: string; icon: any }[] = [
  { label: "Novo aviso", path: "/avisos?new=1", icon: Plus },
  { label: "Iniciar reunião 9:30", path: "/daily-huddle", icon: Zap },
  { label: "Abrir checklist de hoje", path: "/checklist-diario", icon: ClipboardList },
  { label: "Dar Curió de Ouro", path: "/curio-de-ouro?new=1", icon: Flame },
  { label: "Carta do Curiozinho", path: "/curiozinho/historico", icon: Sparkles },
];

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const navigate = useNavigate();

  const { data: people = [] } = useQuery({
    queryKey: ["cmdk", "people"],
    enabled: open,
    staleTime: STALE,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, nome, cargo, unidade")
        .order("nome")
        .limit(300);
      return data ?? [];
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["cmdk", "units"],
    enabled: open,
    staleTime: STALE,
    queryFn: async () => {
      const { data } = await supabase
        .from("units")
        .select("id, code, name")
        .eq("active", true)
        .order("code");
      return data ?? [];
    },
  });

  const { data: avisos = [] } = useQuery({
    queryKey: ["cmdk", "avisos"],
    enabled: open,
    staleTime: STALE,
    queryFn: async () => {
      const { data } = await supabase
        .from("avisos")
        .select("id, titulo, created_at")
        .eq("ativo", true)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const { data: articles = [] } = useQuery({
    queryKey: ["cmdk", "articles"],
    enabled: open,
    staleTime: STALE,
    queryFn: async () => {
      const { data } = await supabase
        .from("playbook_articles")
        .select("id, title, tags")
        .eq("active", true)
        .order("updated_at", { ascending: false })
        .limit(150);
      return data ?? [];
    },
  });

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar pessoas, unidades, páginas, ações..."
        aria-label="Buscar no Conecta Curió"
      />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>

        <CommandGroup heading="Páginas">
          {PAGES.map((p) => (
            <CommandItem
              key={p.path}
              value={`pagina ${p.label} ${p.keywords ?? ""}`}
              onSelect={() => go(p.path)}
            >
              <p.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{p.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{p.path}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações rápidas">
          {ACTIONS.map((a) => (
            <CommandItem key={a.label} value={`acao ${a.label}`} onSelect={() => go(a.path)}>
              <a.icon className="mr-2 h-4 w-4 text-primary" />
              <span>{a.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {people.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Pessoas">
              {people.map((p: any) => (
                <CommandItem
                  key={p.user_id}
                  value={`pessoa ${p.nome ?? ""} ${p.cargo ?? ""} ${p.unidade ?? ""}`}
                  onSelect={() => go(`/colaboradores/${p.user_id}`)}
                >
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{p.nome}</span>
                  <span className="ml-auto text-xs text-muted-foreground truncate max-w-[200px]">
                    {[p.cargo, p.unidade].filter(Boolean).join(" • ")}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {units.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Unidades">
              {units.map((u: any) => (
                <CommandItem
                  key={u.id}
                  value={`unidade ${u.name} ${u.code}`}
                  onSelect={() => go(`/unidade/${u.id}`)}
                >
                  <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{u.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{u.code}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {avisos.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Avisos">
              {avisos.map((a: any) => (
                <CommandItem
                  key={a.id}
                  value={`aviso ${a.titulo}`}
                  onSelect={() => go(`/avisos/${a.id}`)}
                >
                  <Megaphone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{a.titulo}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {articles.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Caderno">
              {articles.map((a: any) => (
                <CommandItem
                  key={a.id}
                  value={`caderno ${a.title} ${(a.tags ?? []).join(" ")}`}
                  onSelect={() => go(`/caderno/${a.id}`)}
                >
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{a.title}</span>
                  {a.tags?.length ? (
                    <span className="ml-auto text-xs text-muted-foreground truncate max-w-[180px]">
                      {a.tags.slice(0, 3).join(", ")}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
