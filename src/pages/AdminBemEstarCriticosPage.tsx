import { useWellbeingCriticalAlerts } from "@/hooks/useWellbeing";
import { Card } from "@/components/ui/card";
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminBemEstarCriticosPage() {
  const { data: alerts, isLoading } = useWellbeingCriticalAlerts();

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          Casos críticos — últimos 30 dias
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Identidades hasheadas pra preservar privacidade. Use os recursos de apoio pra encaminhar.
        </p>
      </header>

      <Card className="p-4 bg-muted/40 border-dashed text-sm text-muted-foreground">
        <strong className="text-foreground">Como agir com cuidado:</strong> casos críticos não devem ser tratados como denúncia ou expostos. Reforce comunicação geral sobre apoio, ofereça canais e cuide do clima da unidade.
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !alerts?.length ? (
        <Card className="p-8 text-center text-muted-foreground">
          Nenhum caso crítico nos últimos 30 dias.
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <Card key={i} className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="font-mono text-xs text-muted-foreground">
                #{a.user_hash.slice(0, 12)}…
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(a.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </div>
              <Link to="/bem-estar/recursos" className="text-sm text-primary inline-flex items-center gap-1">
                Encaminhar pra rede de apoio <ExternalLink className="h-3 w-3" />
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
