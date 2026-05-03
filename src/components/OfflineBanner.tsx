import { WifiOff, RefreshCw } from "lucide-react";
import { useOffline } from "@/contexts/OfflineContext";

export function OfflineBanner() {
  const { status, pending } = useOffline();
  if (status === "online") return null;
  const isSync = status === "sync";
  return (
    <div className={`flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium ${isSync ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-destructive/10 text-destructive"}`}>
      {isSync ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <WifiOff className="h-3.5 w-3.5" />}
      <span>
        {isSync
          ? `Sincronizando ${pending.length} ${pending.length === 1 ? "ação" : "ações"}…`
          : "Modo offline — suas ações serão salvas e sincronizadas quando a conexão voltar."}
      </span>
    </div>
  );
}
