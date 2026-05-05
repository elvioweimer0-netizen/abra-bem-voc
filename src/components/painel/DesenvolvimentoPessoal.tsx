import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, MessageCircle, BookOpen, MapPin, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DesenvolvimentoPessoal() {
  const navigate = useNavigate();
  const items = [
    { label: "Meu PDI", href: "/pdi", icon: GraduationCap },
    { label: "Feedback espelho", href: "/meu-feedback", icon: MessageCircle },
    { label: "Caderno do gerente", href: "/caderno", icon: BookOpen },
    { label: "Última visita", href: "/historico-visitas", icon: MapPin },
  ];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Desenvolvimento pessoal</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {items.map((i) => (
          <button
            key={i.label}
            onClick={() => navigate(i.href)}
            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <i.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{i.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
