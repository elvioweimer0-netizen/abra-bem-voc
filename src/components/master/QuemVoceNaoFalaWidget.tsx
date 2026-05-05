import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGerentesOverview } from "@/hooks/useMasterData";

export function QuemVoceNaoFalaWidget() {
  const navigate = useNavigate();
  const { data: gerentes = [] } = useGerentesOverview();
  const top3 = [...gerentes]
    .sort((a, b) => (b.days_since_1on1 ?? 999) - (a.days_since_1on1 ?? 999))
    .slice(0, 3);

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quem você não fala há mais tempo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {top3.length === 0 && <p className="text-sm text-muted-foreground">Sem dados.</p>}
        {top3.map((g) => (
          <div key={g.id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={g.foto_url ?? undefined} />
              <AvatarFallback className="text-xs">{g.nome?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{g.nome}</p>
              <p className="text-[11px] text-muted-foreground">
                {g.days_since_1on1 != null ? `${g.days_since_1on1} dias sem 1:1` : "sem 1:1 registrada"}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/master/agenda")}>Marcar 1:1</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
