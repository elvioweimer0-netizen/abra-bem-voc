import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export type Alerta = { id: string; title: string; detail?: string };

export function AlertasRiscos({ alertas }: { alertas: Alerta[] }) {
  if (!alertas.length) return null;
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-4 h-4" /> Alertas e riscos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {alertas.map((a) => (
            <li key={a.id} className="text-sm">
              <p className="font-medium text-foreground">{a.title}</p>
              {a.detail && <p className="text-xs text-muted-foreground">{a.detail}</p>}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
