import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export function LinhaDoTempoArea() {
  // Placeholder timeline — agrega eventos das últimas 24h da área (consumido por hooks específicos no futuro).
  const eventos: { hour: string; text: string }[] = [];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> Linha do tempo (24h)</CardTitle>
      </CardHeader>
      <CardContent>
        {eventos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem eventos relevantes nas últimas 24h.</p>
        ) : (
          <ul className="space-y-2">
            {eventos.map((e, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-muted-foreground w-12 shrink-0">{e.hour}</span>
                <span className="text-foreground">{e.text}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
