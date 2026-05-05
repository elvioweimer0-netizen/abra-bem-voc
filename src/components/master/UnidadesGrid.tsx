import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, MessageCircle, MapPin } from "lucide-react";
import { useNetworkSalesToday } from "@/hooks/useMasterData";
import { cn } from "@/lib/utils";

export function UnidadesGrid() {
  const navigate = useNavigate();
  const { data, isLoading } = useNetworkSalesToday();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Suas 7 unidades</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {data?.byUnit.map(({ unit, achievement_pct, revenue_today }) => {
          const ach = achievement_pct ?? 0;
          const semaforo = ach >= 100 ? "bg-success" : ach >= 80 ? "bg-warning" : "bg-destructive";
          const tone = ach >= 100 ? "text-success" : ach >= 80 ? "text-warning" : "text-destructive";
          return (
            <Card key={unit.id} className="rounded-xl overflow-hidden">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{unit.name}</p>
                    <p className="text-[10px] text-muted-foreground">{unit.code}</p>
                  </div>
                  <div className={cn("h-3 w-3 rounded-full shrink-0", semaforo)} aria-hidden />
                </div>
                <div>
                  <p className={cn("text-xl font-bold", tone)}>{achievement_pct != null ? `${ach.toFixed(0)}%` : "—"}</p>
                  <p className="text-[11px] text-muted-foreground">R$ {revenue_today.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="flex-1 h-8 px-2" onClick={() => navigate(`/master/unidade/${unit.id}?modo=espiao`)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-8 px-2" onClick={() => navigate("/chat")}>
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-8 px-2" onClick={() => navigate("/master/agenda")}>
                    <MapPin className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
