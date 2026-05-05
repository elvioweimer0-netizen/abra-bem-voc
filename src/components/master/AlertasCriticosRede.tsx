import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MessageSquareWarning, ChevronRight } from "lucide-react";
import { useNetworkUrgencias } from "@/hooks/useMasterData";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AlertasCriticosRede() {
  const navigate = useNavigate();
  const { data, isLoading } = useNetworkUrgencias();

  const items: { type: string; icon: any; title: string; subtitle: string; href: string }[] = [];
  data?.incidents.forEach((i: any) => {
    items.push({
      type: "incident",
      icon: AlertTriangle,
      title: `Incidente grave: ${(i.description ?? "").slice(0, 60) || "Sem descrição"}`,
      subtitle: `Aberto há ${formatDistanceToNow(new Date(i.created_at), { locale: ptBR })}`,
      href: "/seguranca",
    });
  });
  data?.complaints.forEach((c: any) => {
    items.push({
      type: "complaint",
      icon: MessageSquareWarning,
      title: `Reclamação: ${c.category ?? "Sem categoria"}`,
      subtitle: `Há ${formatDistanceToNow(new Date(c.created_at), { locale: ptBR })}`,
      href: "/admin/reclamacoes",
    });
  });

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Alertas críticos da rede
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Sem alertas críticos. Tudo sob controle.</p>
        ) : (
          <div className="divide-y">
            {items.slice(0, 8).map((it, i) => (
              <button
                key={i}
                onClick={() => navigate(it.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 text-left"
              >
                <it.icon className="h-4 w-4 text-destructive shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{it.title}</p>
                  <p className="text-[11px] text-muted-foreground">{it.subtitle}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
