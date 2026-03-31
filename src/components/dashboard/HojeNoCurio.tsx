import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Target, Bell, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HojeItem {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  type: "meta" | "aviso" | "campanha" | "lembrete";
}

const defaultItems: HojeItem[] = [
  { icon: Target, text: "Meta do dia: foco total no atendimento ao cliente!", type: "meta" },
  { icon: Zap, text: "Campanha ativa: Semana do Colaborador Curió", type: "campanha" },
  { icon: Bell, text: "Confira os avisos atualizados da sua unidade", type: "aviso" },
];

const typeColors: Record<string, string> = {
  meta: "bg-primary/10 text-primary",
  aviso: "bg-warning/10 text-warning",
  campanha: "bg-success/10 text-success",
  lembrete: "bg-muted text-muted-foreground",
};

const typeLabels: Record<string, string> = {
  meta: "Meta",
  aviso: "Aviso",
  campanha: "Campanha",
  lembrete: "Lembrete",
};

export function HojeNoCurio() {
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Card className="card-shadow border-l-4 border-l-highlight">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-highlight/15 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-highlight-foreground" />
          </div>
          Hoje no Curió
          <span className="text-xs font-normal text-muted-foreground capitalize ml-auto">
            {today}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {defaultItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeColors[item.type]}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <p className="text-sm text-foreground flex-1">{item.text}</p>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {typeLabels[item.type]}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
