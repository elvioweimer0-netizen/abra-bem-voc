import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useOffline } from "@/contexts/OfflineContext";

export function OnlineStatusDot() {
  const { status, pending } = useOffline();
  const navigate = useNavigate();
  const color =
    status === "online" ? "bg-emerald-500" : status === "sync" ? "bg-amber-500" : "bg-destructive";
  const label =
    status === "online"
      ? pending.length > 0
        ? `Online • ${pending.length} pendente(s)`
        : "Online"
      : status === "sync"
      ? "Sincronizando…"
      : "Offline";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => navigate("/perfil/sincronizacao")}
          aria-label={`Status de conexão: ${label}`}
          className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
        >
          <span className={`h-2.5 w-2.5 rounded-full ${color} ${status === "sync" ? "animate-pulse" : ""}`} />
          {pending.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
              {pending.length > 99 ? "99+" : pending.length}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
