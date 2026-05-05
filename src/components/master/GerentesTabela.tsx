import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useGerentesOverview } from "@/hooks/useMasterData";
import { Calendar, MessageCircle, FileText, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function GerentesTabela() {
  const navigate = useNavigate();
  const { data: gerentes = [], isLoading } = useGerentesOverview();
  const [filter, setFilter] = useState("");

  const sorted = useMemo(() => {
    return [...gerentes]
      .filter((g) => g.nome?.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => {
        const scoreA = a.score ?? 0;
        const scoreB = b.score ?? 0;
        const daysA = a.days_since_1on1 ?? 999;
        const daysB = b.days_since_1on1 ?? 999;
        return scoreA - scoreB || daysB - daysA;
      });
  }, [gerentes, filter]);

  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Time de gerentes ({gerentes.length})</CardTitle>
        <Input
          placeholder="Filtrar..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-[180px] h-8 text-sm"
        />
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
        ) : sorted.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Nenhum gerente encontrado.</p>
        ) : (
          <div className="divide-y">
            {sorted.map((g) => {
              const scoreTone = g.score == null ? "muted" : g.score >= 7 ? "default" : g.score >= 5 ? "secondary" : "destructive";
              const days = g.days_since_1on1;
              const daysTone = days == null ? "text-muted-foreground" : days > 30 ? "text-destructive" : days > 15 ? "text-warning" : "text-muted-foreground";
              return (
                <div key={g.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={g.foto_url ?? undefined} />
                    <AvatarFallback className="text-xs">{g.nome?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{g.nome}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{g.unidade ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={scoreTone as any} className="text-xs">{g.score != null ? g.score.toFixed(1) : "—"}</Badge>
                    <span className={cn("text-[11px] hidden md:inline", daysTone)}>
                      {days != null ? `${days}d` : "sem 1:1"}
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => navigate(`/master/gerente/${g.user_id}`)} title="Dossiê">
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => navigate("/chat")} title="DM">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => navigate("/master/agenda")} title="1:1">
                        <Calendar className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => navigate("/reconhecimentos")} title="Reconhecer">
                        <Heart className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
