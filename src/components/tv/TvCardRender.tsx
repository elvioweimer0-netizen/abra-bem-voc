import type { TvCard } from "@/hooks/useTvFeed";
import { Cake, Trophy, Camera, AlertTriangle, CheckCircle2, BookOpen, Megaphone, Award, Sparkles } from "lucide-react";

const TYPE_META: Record<string, { title: string; icon: any; accent: string }> = {
  aniversariantes: { title: "Aniversariantes do dia", icon: Cake, accent: "from-pink-500/20 to-amber-500/10" },
  curio_ouro: { title: "Curió de Ouro", icon: Trophy, accent: "from-amber-500/20 to-orange-500/10" },
  stories_unidade: { title: "Stories da unidade", icon: Camera, accent: "from-purple-500/20 to-fuchsia-500/10" },
  top_pendencias: { title: "Atenção da semana", icon: AlertTriangle, accent: "from-red-500/20 to-orange-500/10" },
  compromissos_semana: { title: "Compromissos cumpridos", icon: CheckCircle2, accent: "from-emerald-500/20 to-teal-500/10" },
  historias_curio: { title: "Histórias do Curió", icon: BookOpen, accent: "from-sky-500/20 to-blue-500/10" },
  avisos_importantes: { title: "Avisos importantes", icon: Megaphone, accent: "from-indigo-500/20 to-violet-500/10" },
  conquistas_equipe: { title: "Conquistas da equipe", icon: Award, accent: "from-yellow-500/20 to-amber-500/10" },
  pilula_cultura: { title: "Pílula de cultura", icon: Sparkles, accent: "from-primary/20 to-secondary/10" },
};

function CardShell({ type, children }: { type: string; children: React.ReactNode }) {
  const meta = TYPE_META[type] ?? { title: type, icon: Sparkles, accent: "from-primary/10 to-transparent" };
  const Icon = meta.icon;
  return (
    <div className={`absolute inset-0 flex flex-col bg-gradient-to-br ${meta.accent} p-16`}>
      <div className="flex items-center gap-6 pb-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/20 text-primary">
          <Icon className="h-14 w-14" />
        </div>
        <h2 className="text-6xl font-bold tracking-tight text-foreground">{meta.title}</h2>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

function Avatar({ url, name, size = "lg" }: { url?: string | null; name: string; size?: "sm" | "lg" | "xl" }) {
  const cls = size === "xl" ? "h-48 w-48 text-7xl" : size === "lg" ? "h-32 w-32 text-5xl" : "h-16 w-16 text-2xl";
  if (url) return <img src={url} alt={name} className={`${cls} rounded-full object-cover ring-4 ring-primary/30`} />;
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  return (
    <div className={`${cls} flex items-center justify-center rounded-full bg-primary/20 font-bold text-primary ring-4 ring-primary/30`}>
      {initials}
    </div>
  );
}

export function TvCardRender({ card }: { card: TvCard }) {
  switch (card.type) {
    case "aniversariantes": {
      const items: any[] = card.data ?? [];
      return (
        <CardShell type={card.type}>
          <div className="grid h-full grid-cols-2 gap-12 place-content-center">
            {items.slice(0, 4).map((p, i) => (
              <div key={i} className="flex items-center gap-8 animate-fade-in">
                <Avatar url={p.foto_url} name={p.nome} size="xl" />
                <div className="min-w-0">
                  <div className="text-5xl font-bold text-foreground truncate">{p.nome}</div>
                  {p.cargo_titulo && <div className="text-3xl text-muted-foreground mt-2">{p.cargo_titulo}</div>}
                  <div className="text-3xl text-primary font-semibold mt-3">🎂 Feliz aniversário!</div>
                </div>
              </div>
            ))}
          </div>
        </CardShell>
      );
    }
    case "curio_ouro": {
      const items: any[] = card.data ?? [];
      return (
        <CardShell type={card.type}>
          <div className="flex h-full flex-col justify-center gap-8">
            {items.slice(0, 3).map((p, i) => (
              <div key={i} className="flex items-start gap-8 rounded-2xl bg-card/60 p-8 animate-fade-in">
                <Avatar url={p.destinatario?.foto_url} name={p.destinatario?.nome ?? "?"} />
                <div className="flex-1 min-w-0">
                  <div className="text-4xl font-bold text-foreground">{p.destinatario?.nome ?? "—"}</div>
                  <div className="text-2xl text-muted-foreground mt-1">por {p.autor?.nome ?? "—"}</div>
                  <div className="mt-3 text-3xl text-foreground/90 leading-snug">"{p.motivo}"</div>
                </div>
              </div>
            ))}
          </div>
        </CardShell>
      );
    }
    case "stories_unidade": {
      const items: any[] = card.data ?? [];
      return (
        <CardShell type={card.type}>
          <div className="grid h-full grid-cols-3 gap-6">
            {items.slice(0, 6).map((s, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl bg-card animate-fade-in">
                {s.media_type === "video" ? (
                  <video src={s.media_url} muted autoPlay loop playsInline className="h-full w-full object-cover" />
                ) : (
                  <img src={s.media_url} alt="" className="h-full w-full object-cover" />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                  <div className="text-xl font-semibold truncate">{s.author?.nome ?? "—"}</div>
                  {s.caption && <div className="text-base opacity-90 line-clamp-2">{s.caption}</div>}
                </div>
              </div>
            ))}
          </div>
        </CardShell>
      );
    }
    case "top_pendencias": {
      const items: any[] = card.data ?? [];
      return (
        <CardShell type={card.type}>
          <div className="flex h-full flex-col justify-center gap-8">
            {items.map((it, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl bg-card/60 p-10 animate-fade-in">
                <div className="flex items-center gap-8">
                  <span className="text-7xl">{it.icon}</span>
                  <span className="text-5xl font-bold text-foreground">{it.label}</span>
                </div>
                <span className="text-7xl font-bold text-destructive">{it.count}</span>
              </div>
            ))}
          </div>
        </CardShell>
      );
    }
    case "compromissos_semana": {
      const items: any[] = card.data ?? [];
      return (
        <CardShell type={card.type}>
          <div className="grid h-full grid-cols-2 gap-6 content-center">
            {items.slice(0, 6).map((c, i) => (
              <div key={i} className="flex items-center gap-6 rounded-2xl bg-card/60 p-6 animate-fade-in">
                <Avatar url={c.user?.foto_url} name={c.user?.nome ?? "?"} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-2xl font-semibold text-foreground truncate">{c.user?.nome ?? "—"}</div>
                  <div className="text-xl text-muted-foreground line-clamp-2">{c.commitment_text}</div>
                </div>
                <CheckCircle2 className="h-12 w-12 text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
        </CardShell>
      );
    }
    case "historias_curio": {
      const items: any[] = card.data ?? [];
      const s = items[0];
      if (!s) return null;
      return (
        <CardShell type={card.type}>
          <div className="grid h-full grid-cols-2 gap-12 items-center">
            {s.image_url ? (
              <img src={s.image_url} alt="" className="h-full w-full rounded-3xl object-cover" />
            ) : (
              <div className="h-full rounded-3xl bg-primary/10" />
            )}
            <div className="min-w-0">
              <div className="text-5xl font-bold text-foreground leading-tight">{s.title}</div>
              <div className="mt-6 text-2xl text-foreground/80 line-clamp-6">{s.content}</div>
              <div className="mt-8 flex items-center gap-4">
                <Avatar url={s.author?.foto_url} name={s.author?.nome ?? "?"} size="sm" />
                <span className="text-2xl text-muted-foreground">por {s.author?.nome ?? "—"}</span>
              </div>
            </div>
          </div>
        </CardShell>
      );
    }
    case "avisos_importantes": {
      const items: any[] = card.data ?? [];
      return (
        <CardShell type={card.type}>
          <div className="flex h-full flex-col justify-center gap-6">
            {items.slice(0, 3).map((a, i) => (
              <div key={i} className={`rounded-2xl p-8 animate-fade-in ${a.urgente ? "bg-destructive/15 ring-2 ring-destructive/40" : "bg-card/60"}`}>
                <div className="flex items-center gap-3 mb-2">
                  {a.urgente && <span className="rounded-full bg-destructive px-4 py-1 text-lg font-bold text-destructive-foreground">URGENTE</span>}
                </div>
                <div className="text-4xl font-bold text-foreground">{a.titulo}</div>
                <div className="text-2xl text-foreground/80 mt-2 line-clamp-3">{a.conteudo}</div>
              </div>
            ))}
          </div>
        </CardShell>
      );
    }
    case "conquistas_equipe": {
      const items: any[] = card.data ?? [];
      return (
        <CardShell type={card.type}>
          <div className="grid h-full grid-cols-2 gap-6 content-center">
            {items.slice(0, 6).map((u, i) => (
              <div key={i} className="flex items-center gap-6 rounded-2xl bg-card/60 p-6 animate-fade-in">
                <div className="text-5xl">{u.achievement?.icon ?? "🏆"}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-2xl font-bold text-foreground truncate">{u.user?.nome ?? "—"}</div>
                  <div className="text-xl text-primary font-semibold truncate">{u.achievement?.name ?? "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </CardShell>
      );
    }
    case "pilula_cultura": {
      const p = card.data;
      if (!p) return null;
      return (
        <CardShell type={card.type}>
          <div className="flex h-full flex-col justify-center items-center text-center px-12">
            <div className="text-7xl font-bold text-foreground leading-tight max-w-5xl">{p.title}</div>
            <div className="mt-10 text-3xl text-foreground/85 max-w-4xl leading-snug">{p.content}</div>
          </div>
        </CardShell>
      );
    }
    default:
      return null;
  }
}
