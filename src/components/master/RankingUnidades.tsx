import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNetworkSalesToday } from "@/hooks/useMasterData";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function RankingUnidades() {
  const { data, isLoading } = useNetworkSalesToday();
  const ranked = [...(data?.byUnit ?? [])].sort((a, b) => (b.achievement_pct ?? 0) - (a.achievement_pct ?? 0));

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Ranking unidades hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="divide-y">
            {ranked.map((r, i) => {
              const ach = r.achievement_pct ?? 0;
              const tone = ach >= 100 ? "text-success" : ach >= 80 ? "text-warning" : "text-destructive";
              return (
                <div key={r.unit.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="w-6 text-center font-bold text-muted-foreground">{i + 1}º</span>
                  <span className="flex-1 truncate font-medium">{r.unit.name}</span>
                  <span className="text-[11px] text-muted-foreground hidden md:inline">R$ {r.revenue_today.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                  <span className={cn("font-semibold w-14 text-right", tone)}>{r.achievement_pct != null ? `${ach.toFixed(0)}%` : "—"}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
