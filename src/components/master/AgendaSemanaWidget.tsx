import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { useMasterAgenda } from "@/hooks/useMasterData";

export function AgendaSemanaWidget() {
  const navigate = useNavigate();
  const { data } = useMasterAgenda();
  const items = [
    ...(data?.oneOnOnes ?? []).map((o) => ({ id: o.id, type: "1:1", date: o.scheduled_for, title: "1:1 com gerente" })),
    ...(data?.visits ?? []).map((v) => ({ id: v.id, type: "Visita", date: v.scheduled_for, title: "Visita à loja" })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Agenda da semana
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={() => navigate("/master/agenda")}>
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada agendado.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
              <div>
                <p className="font-medium">{it.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(it.date).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
                </p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted">{it.type}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
