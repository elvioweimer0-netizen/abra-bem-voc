import { Bell, MessageSquare, BarChart3, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ComunicacaoBar() {
  const navigate = useNavigate();
  const items = [
    { icon: Bell, label: "Avisos", href: "/avisos" },
    { icon: MessageSquare, label: "Chat", href: "/chat" },
    { icon: BarChart3, label: "Enquetes", href: "/polls" },
    { icon: Mic, label: "Carta", href: "/curiozinho-historico" },
  ];
  return (
    <div className="sticky bottom-0 lg:static z-10 bg-card border-t lg:border lg:rounded-xl border-border card-shadow">
      <div className="grid grid-cols-4 lg:grid-cols-1 lg:divide-y lg:divide-border">
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => navigate(it.href)}
            className="flex lg:flex-row flex-col items-center justify-center lg:justify-start gap-1 lg:gap-3 py-3 px-3 hover:bg-muted/40 transition-colors"
          >
            <it.icon className="w-5 h-5 text-primary" />
            <span className="text-xs lg:text-sm font-medium">{it.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
