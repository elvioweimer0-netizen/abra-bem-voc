import { useState } from "react";
import { format } from "date-fns";
import { Check, CheckCheck, MoreHorizontal, Reply, Smile, Trash2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ChatMessage } from "@/hooks/useConversation";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "💪"];

interface Props {
  msg: ChatMessage;
  isMine: boolean;
  isAdmin: boolean;
  onReply: (m: ChatMessage) => void;
  onReact: (id: string, emoji: string) => void;
  onDelete: (id: string) => void;
  showAuthor?: boolean;
}

export function MessageBubble({ msg, isMine, isAdmin, onReply, onReact, onDelete, showAuthor }: Props) {
  const [hover, setHover] = useState(false);
  if (msg.deleted_at) {
    return (
      <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
        <div className="max-w-[70%] rounded-2xl bg-muted/50 px-3 py-2 italic text-xs text-muted-foreground">
          🚫 Mensagem apagada
        </div>
      </div>
    );
  }

  const reactions = (msg.reactions ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1; return acc;
  }, {});

  return (
    <div className={cn("group flex", isMine ? "justify-end" : "justify-start")} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="max-w-[75%] flex flex-col gap-1">
        {showAuthor && !isMine && (
          <span className="px-3 text-[11px] font-medium text-primary">{msg.author_name}</span>
        )}
        <div className={cn(
          "relative rounded-2xl px-3 py-2 text-sm shadow-sm",
          isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm",
          msg.status === "sending" && "opacity-70",
        )}>
          {msg.media_type === "image" && msg.media_url && (
            <img src={msg.media_url} alt="" className="rounded-lg mb-1 max-w-full max-h-72 object-cover" loading="lazy" />
          )}
          {msg.media_type === "video" && msg.media_url && (
            <video src={msg.media_url} controls className="rounded-lg mb-1 max-w-full max-h-72" />
          )}
          {msg.media_type === "audio" && msg.media_url && (
            <audio src={msg.media_url} controls className="mb-1 max-w-full" />
          )}
          {msg.media_type === "document" && msg.media_url && (
            <a href={msg.media_url} target="_blank" rel="noreferrer" className="block underline mb-1">📄 Abrir documento</a>
          )}
          {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
          <div className={cn("mt-0.5 flex items-center gap-1 justify-end text-[10px]", isMine ? "text-primary-foreground/70" : "text-muted-foreground")}>
            <span>{format(new Date(msg.created_at), "HH:mm")}</span>
            {msg.edited_at && <span>(editada)</span>}
            {isMine && (
              (msg.read_count ?? 0) > 1 ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />
            )}
          </div>

          {hover && (
            <div className={cn("absolute -top-3 flex gap-0.5 bg-popover border border-border rounded-full shadow px-1 py-0.5", isMine ? "right-2" : "left-2")}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><Smile className="h-3.5 w-3.5" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1 flex gap-1">
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => onReact(msg.id, e)} className="text-lg hover:scale-125 transition-transform">{e}</button>
                  ))}
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onReply(msg)}><Reply className="h-3.5 w-3.5" /></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isMine ? "end" : "start"}>
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(msg.content ?? "")}>Copiar</DropdownMenuItem>
                  {(isMine || isAdmin) && (
                    <DropdownMenuItem onClick={() => onDelete(msg.id)} className="text-destructive">
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Apagar
                    </DropdownMenuItem>
                  )}
                  {!isMine && (
                    <DropdownMenuItem onClick={async () => {
                      const reason = prompt("Motivo da denúncia:");
                      if (!reason) return;
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return;
                      await supabase.from("chat_message_reports" as any).insert({ message_id: msg.id, reporter_user_id: user.id, reason });
                      toast.success("Mensagem reportada");
                    }}>
                      <Flag className="h-3.5 w-3.5 mr-2" /> Reportar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        {Object.keys(reactions).length > 0 && (
          <div className={cn("flex gap-1", isMine ? "justify-end" : "justify-start")}>
            {Object.entries(reactions).map(([e, n]) => (
              <button key={e} onClick={() => onReact(msg.id, e)} className="text-xs bg-muted rounded-full px-1.5 py-0.5 border border-border hover:bg-muted/80">
                {e} {n}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
