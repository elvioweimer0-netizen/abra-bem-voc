import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMyCommitments, getMonday } from "@/hooks/useWeeklyCommitments";

export function CompromissosCalendario() {
  const navigate = useNavigate();
  const { data: commitments = [] } = useMyCommitments(getMonday());

  const today = new Date().getDay();
  const eventos: { label: string; when: string }[] = [
    { label: "Daily 9:30", when: "Hoje" },
    ...(today === 1 ? [{ label: "RAC", when: "Hoje 9:30" }] : []),
    ...(today === 5 ? [{ label: "1:1 com líder", when: "Hoje" }] : []),
  ];

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> Compromissos & agenda</CardTitle>
        <button onClick={() => navigate("/compromissos")} className="text-xs text-primary font-medium">Ver tudo</button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground mb-2">Meus compromissos da semana</p>
          {commitments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum compromisso declarado.</p>
          ) : (
            <ul className="space-y-1.5">
              {commitments.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{c.commitment_text}</span>
                  <Badge variant={c.status === "cumprido" ? "default" : "secondary"}>{c.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground mb-2">Próximos eventos</p>
          <ul className="space-y-1.5">
            {eventos.map((e) => (
              <li key={e.label} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{e.label}</span>
                <span className="text-muted-foreground text-xs">{e.when}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
