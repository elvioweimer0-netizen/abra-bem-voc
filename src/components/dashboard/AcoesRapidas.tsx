import { Card, CardContent } from "@/components/ui/card";
import {
  Video, FileText, CalendarDays, Headphones,
  Bell, MessageSquare, Camera, Bot,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/hooks/useRole";

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  gestaoOnly?: boolean;
}

const allActions: QuickAction[] = [
  { label: "Entrar na Reunião", icon: Video, href: "/reunioes", color: "bg-primary/10 text-primary" },
  { label: "Avisos Importantes", icon: Bell, href: "/avisos", color: "bg-warning/10 text-warning" },
  { label: "Minha Agenda", icon: CalendarDays, href: "/agenda", color: "bg-success/10 text-success" },
  { label: "Galeria do Curió", icon: Camera, href: "/galeria", color: "bg-highlight/15 text-highlight-foreground" },
  { label: "Falar com RH", icon: MessageSquare, href: "/assistente", color: "bg-muted text-muted-foreground" },
  { label: "Assistente IA", icon: Bot, href: "/assistente", color: "bg-primary/10 text-primary" },
  { label: "Relatórios", icon: FileText, href: "/relatorios", color: "bg-muted text-muted-foreground", gestaoOnly: true },
];

export function AcoesRapidas() {
  const navigate = useNavigate();
  const { isGestao } = useRole();

  const visibleActions = allActions.filter((a) => !a.gestaoOnly || isGestao);

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
        ⚡ Ações Rápidas
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {visibleActions.map((action) => (
          <Card
            key={action.label}
            className="card-shadow hover:card-shadow-md transition-all cursor-pointer group hover:-translate-y-0.5"
            onClick={() => navigate(action.href)}
          >
            <CardContent className="p-4 flex flex-col items-center gap-2.5 text-center">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}
              >
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-foreground leading-tight">
                {action.label}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
