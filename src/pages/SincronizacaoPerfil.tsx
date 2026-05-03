import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOffline } from "@/contexts/OfflineContext";
import { clearQueue } from "@/lib/offlineQueue";
import { RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

const typeLabels: Record<string, string> = {
  aviso_read: "Marcar aviso como lido",
  checklist_response: "Resposta de checklist",
  praise_create: "Elogio enviado",
};

export default function SincronizacaoPerfil() {
  const { status, pending, forceSync, refreshQueue } = useOffline();
  const [busy, setBusy] = useState(false);

  const handleSync = async () => {
    setBusy(true);
    await forceSync();
    setBusy(false);
    toast.success("Sincronização concluída");
  };

  const handleClear = async () => {
    if (!confirm("Tem certeza? Ações pendentes serão descartadas.")) return;
    await clearQueue();
    await refreshQueue();
    toast.success("Fila limpa");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "offline" ? <WifiOff className="h-5 w-5 text-destructive" /> : <Wifi className="h-5 w-5 text-emerald-500" />}
            Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Status atual: <Badge variant={status === "online" ? "default" : status === "sync" ? "secondary" : "destructive"}>{status === "online" ? "Online" : status === "sync" ? "Sincronizando" : "Offline"}</Badge>
          </p>
          <p className="text-sm text-muted-foreground">
            Ações pendentes: <strong>{pending.length}</strong>
          </p>
          <div className="flex gap-2">
            <Button onClick={handleSync} disabled={busy || status === "offline" || pending.length === 0}>
              <RefreshCw className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`} />
              Sincronizar agora
            </Button>
            {pending.length > 0 && (
              <Button variant="outline" onClick={handleClear} disabled={busy}>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar fila
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fila local</CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ação pendente. Tudo sincronizado.</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((a) => (
                <li key={a.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <strong>{typeLabels[a.type] || a.type}</strong>
                    <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                  {a.retries > 0 && <p className="mt-1 text-xs text-muted-foreground">Tentativas: {a.retries}</p>}
                  {a.last_error && <p className="mt-1 text-xs text-destructive">Erro: {a.last_error}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
