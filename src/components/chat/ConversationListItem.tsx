import { useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ConversationListItem } from "@/hooks/useConversations";
import { Hash, Users, Volume2, VolumeX } from "lucide-react";

interface Props {
  item: ConversationListItem;
  active: boolean;
  onSelect: (id: string) => void;
}

export function ConversationListItemView({ item, active, onSelect }: Props) {
  const title = item.type === "direct" ? (item.other_name ?? "Conversa") : (item.name ?? "Grupo");
  const foto = item.type === "direct" ? item.other_foto : item.image_url;
  const initials = (title || "?").split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const Icon = item.type === "channel" ? Hash : item.type === "direct" ? null : Users;
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
        active ? "bg-accent" : "hover:bg-muted/60",
      )}
    >
      <div className="relative h-11 w-11 shrink-0 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden text-sm font-semibold text-primary">
        {foto ? <img src={foto} alt={title} className="h-full w-full object-cover" /> : (Icon ? <Icon className="h-5 w-5" /> : initials)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">{title}</p>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatDistanceToNowStrict(new Date(item.last_message_at), { locale: ptBR, addSuffix: false })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">{item.last_message_preview ?? "Sem mensagens"}</p>
          <div className="flex items-center gap-1 shrink-0">
            {item.muted && <VolumeX className="h-3 w-3 text-muted-foreground" />}
            {item.unread > 0 && !item.muted && (
              <Badge className="h-5 min-w-5 justify-center px-1.5 text-[10px]">{item.unread}</Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
