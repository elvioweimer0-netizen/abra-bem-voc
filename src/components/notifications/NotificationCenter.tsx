import { useState } from "react";
import { Bell, ChevronDown, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationGroups, useNotificationEvents, type NotificationGroup } from "@/hooks/useNotificationGroups";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

function GroupRow({ group }: { group: NotificationGroup }) {
  const [open, setOpen] = useState(false);
  const { data: events } = useNotificationEvents(group.grouping_key, open && group.event_count > 1);
  const aggText =
    group.event_count > 1
      ? `${group.event_count} atualizações: ${group.sample_title}`
      : group.sample_title;

  return (
    <div className={cn("rounded-lg border border-border/50 bg-card p-3 transition-colors", group.unread_count > 0 && "border-primary/40 bg-primary/5")}>
      <button
        type="button"
        className="flex w-full items-start gap-2 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{aggText}</p>
            {group.event_count > 1 && (
              <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px]">{group.event_count}</Badge>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{group.sample_body}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(group.latest_at), { locale: ptBR, addSuffix: true })}
          </p>
        </div>
        {group.event_count > 1 && (
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        )}
      </button>
      {open && group.event_count > 1 && events && events.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-border/50 pt-2">
          {events.map((ev) => (
            <li key={ev.id} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{ev.title}</span> — {ev.body}
              <span className="ml-1 text-[10px]">· {formatDistanceToNow(new Date(ev.created_at), { locale: ptBR, addSuffix: true })}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const { groups, totalUnread, isLoading } = useNotificationGroups();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          aria-label="Abrir notificações"
        >
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-card">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notificações</p>
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => navigate("/meu-perfil")}>
            <SettingsIcon className="h-3.5 w-3.5" /> Configurar
          </Button>
        </div>
        <ScrollArea className="max-h-[480px]">
          <div className="space-y-2 p-3">
            {isLoading ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">Carregando…</p>
            ) : groups.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">Nenhuma notificação nas últimas 4 horas.</p>
            ) : (
              groups.map((g) => <GroupRow key={g.grouping_key} group={g} />)
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
