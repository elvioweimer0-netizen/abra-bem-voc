import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Sparkles, Pin, CalendarPlus, MapPin, Heart } from "lucide-react";

export function AcoesMaster() {
  const navigate = useNavigate();
  const acoes = [
    { label: "Postar aviso pra rede", icon: Megaphone, href: "/avisos" },
    { label: "Pílula de Cultura", icon: Sparkles, href: "/admin/cultura" },
    { label: "Atalho do painel", icon: Pin, href: "/master/atalho" },
    { label: "Marcar 1:1", icon: CalendarPlus, href: "/master/agenda" },
    { label: "Agendar visita", icon: MapPin, href: "/master/agenda" },
    { label: "Reconhecer público", icon: Heart, href: "/reconhecimentos" },
  ];
  return (
    <Card className="rounded-xl">
      <CardContent className="p-3 grid grid-cols-3 md:grid-cols-6 gap-2">
        {acoes.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.href)}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors"
          >
            <a.icon className="h-5 w-5 text-primary" />
            <span className="text-[11px] text-center leading-tight font-medium">{a.label}</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
