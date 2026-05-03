import { useHallDoMes } from "@/hooks/useCurioStories";
import { HistoriaCard } from "@/components/historias/HistoriaCard";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function HistoriasHallDoMes() {
  const { data: stories, isLoading } = useHallDoMes();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground inline-flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" /> Hall do Mês
        </h1>
        <p className="text-sm text-muted-foreground mt-1">As 5 histórias mais curtidas neste mês.</p>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !stories?.length ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Ainda sem histórias neste mês.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stories.map((s, i) => (
            <div key={s.id} className="relative">
              <div className="absolute -top-2 -left-2 h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center z-10 shadow">
                {i + 1}
              </div>
              <HistoriaCard story={s} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
