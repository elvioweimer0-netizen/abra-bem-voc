import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTvFeed } from "@/hooks/useTvFeed";
import { TvCardRender } from "@/components/tv/TvCardRender";

export default function TvDisplay() {
  const { token } = useParams<{ token: string }>();
  const { data, error, isLoading } = useTvFeed(token);
  const [idx, setIdx] = useState(0);

  // Wake lock
  useEffect(() => {
    let lock: any;
    const anyNav = navigator as any;
    if (anyNav.wakeLock?.request) {
      anyNav.wakeLock.request("screen").then((l: any) => (lock = l)).catch(() => {});
    }
    return () => { try { lock?.release?.(); } catch {} };
  }, []);

  // Rotation
  const cards = data?.cards ?? [];
  const duration = (data?.display.slide_duration_seconds ?? 12) * 1000;
  useEffect(() => {
    if (cards.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % cards.length), duration);
    return () => clearInterval(t);
  }, [cards.length, duration]);

  useEffect(() => {
    if (idx >= cards.length && cards.length > 0) setIdx(0);
  }, [cards.length, idx]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-12 text-center">
        <div className="text-6xl mb-6">📺</div>
        <h1 className="text-5xl font-bold text-foreground mb-4">TV não autorizada</h1>
        <p className="text-2xl text-muted-foreground max-w-2xl">
          Token inválido ou TV desativada. Peça ao administrador para gerar uma nova URL no painel.
        </p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-12 text-center">
        <div className="text-6xl mb-6">😴</div>
        <h1 className="text-5xl font-bold text-foreground mb-4">Sem conteúdo no momento</h1>
        <p className="text-2xl text-muted-foreground">Volte mais tarde — esperando dados da unidade.</p>
      </div>
    );
  }

  const current = cards[idx];

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <div key={idx} className="absolute inset-0 animate-fade-in">
        <TvCardRender card={current} />
      </div>

      {/* Header label */}
      <div className="absolute top-6 right-8 z-10 flex items-center gap-3 rounded-full bg-background/70 px-5 py-2 backdrop-blur-md">
        <img src="/logos/curio_logo_vermelho.png" alt="" className="h-8 w-8 object-contain" />
        <span className="text-lg font-bold text-foreground">{data.display.unit_name ?? data.display.name}</span>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {cards.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${i === idx ? "w-12 bg-primary" : "w-2 bg-muted-foreground/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
