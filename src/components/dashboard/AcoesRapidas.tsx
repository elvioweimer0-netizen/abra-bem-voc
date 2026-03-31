import { Card, CardContent } from "@/components/ui/card";
import {
  Megaphone, Heart, ClipboardList, Headphones,
  FileText, Video, Calendar, Users,
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
  { label: "Ver Notícias", icon: Megaphone, href: "/noticias", color: "bg-primary/10 text-primary" },
  { label: "Endomarketing", icon: Heart, href: "/endomarketing", color: "bg-rose-500/10 text-rose-500" },
  { label: "Avisos", icon: ClipboardList, href: "/avisos", color: "bg-amber-500/10 text-amber-500" },
  { label: "Assistente IA", icon: Headphones, href: "/assistente", color: "bg-success/10 text-success" },
  { label: "Departamentos", icon: Users, href: "/departamentos", color: "bg-primary/10 text-primary", gestaoOnly: false },
  { label: "Relatórios", icon: FileText, href: "/relatorios", color: "bg-muted-foreground/10 text-muted-foreground", gestaoOnly: true },
];

export function AcoesRapidas() {
  const navigate = useNavigate();
  const { isGestao } = useRole();

  const visibleActions = allActions.filter((a) => !a.gestaoOnly || isGestao);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {visibleActions.map((action) => (
        <Card
          key={action.label}
          className="card-shadow hover:card-shadow-md transition-shadow cursor-pointer group"
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
  );
}
