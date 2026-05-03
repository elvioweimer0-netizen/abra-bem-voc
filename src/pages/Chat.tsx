import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Hash, MessageSquarePlus, Search, Users } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useConversation, type ChatMessage } from "@/hooks/useConversation";
import { useChatPresence } from "@/hooks/useChatPresence";
import { ConversationListItemView } from "@/components/chat/ConversationListItem";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { NewConversationModal } from "@/components/chat/NewConversationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { isAdmin } = useRole();
  const isMobile = useIsMobile();
  const { data: conversations = [] } = useConversations();
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  const activeId = id ?? null;
  const active = conversations.find((c) => c.id === activeId) ?? null;
  const { messages, sendMessage, toggleReaction, deleteMessage } = useConversation(activeId);
  const { online, typing, sendTyping } = useChatPresence(activeId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, activeId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const title = c.type === "direct" ? c.other_name : c.name;
      return (title ?? "").toLowerCase().includes(q);
    });
  }, [conversations, search]);

  const showList = !isMobile || !activeId;
  const showConv = !isMobile || !!activeId;
  const isGroup = active && active.type !== "direct";
  const headerTitle = active ? (active.type === "direct" ? active.other_name : active.name) : "";
  const headerIcon = active?.type === "channel" ? Hash : (active?.type !== "direct" ? Users : null);
  const typingNames = Object.values(typing);
  const otherOnline = active?.type === "direct" && active.other_user_id ? !!online[active.other_user_id] : false;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      {showList && (
        <aside className={cn("flex flex-col border-r border-border bg-card", isMobile ? "w-full" : "w-80 shrink-0")}>
          <div className="p-3 border-b border-border flex items-center gap-2">
            <h1 className="text-lg font-semibold flex-1">Chat</h1>
            <Button size="icon" variant="ghost" onClick={() => setNewOpen(true)}><MessageSquarePlus className="h-5 w-5" /></Button>
          </div>
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar conversas..." className="pl-9 h-10" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filtered.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8 px-4">
                Nenhuma conversa. Toque em <MessageSquarePlus className="inline h-4 w-4" /> para começar.
              </div>
            )}
            {filtered.map((c) => (
              <ConversationListItemView key={c.id} item={c} active={c.id === activeId} onSelect={(id) => navigate(`/chat/${id}`)} />
            ))}
          </div>
        </aside>
      )}

      {showConv && (
        <section className="flex-1 flex flex-col min-w-0">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Selecione uma conversa
            </div>
          ) : (
            <>
              <header className="border-b border-border bg-card px-3 py-2 flex items-center gap-3">
                {isMobile && (
                  <Button size="icon" variant="ghost" onClick={() => navigate("/chat")}><ArrowLeft className="h-5 w-5" /></Button>
                )}
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden text-sm font-semibold text-primary">
                  {(active.type === "direct" ? active.other_foto : active.image_url)
                    ? <img src={(active.type === "direct" ? active.other_foto : active.image_url) ?? ""} alt="" className="h-full w-full object-cover" />
                    : (headerIcon ? <headerIcon className="h-5 w-5" /> : (headerTitle?.[0] ?? "?"))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{headerTitle}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {typingNames.length > 0 ? `${typingNames.join(", ")} digitando...` : (otherOnline ? "online" : (active.type !== "direct" ? "Grupo" : "offline"))}
                  </p>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-muted/20">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-12">Diga oi 👋</div>
                )}
                {messages.map((m, i) => {
                  const prev = messages[i - 1];
                  const showAuthor = isGroup && m.author_user_id !== prev?.author_user_id;
                  return (
                    <MessageBubble
                      key={m.id} msg={m}
                      isMine={m.author_user_id === profile?.user_id}
                      isAdmin={isAdmin}
                      onReply={setReplyTo}
                      onReact={toggleReaction}
                      onDelete={deleteMessage}
                      showAuthor={showAuthor}
                    />
                  );
                })}
              </div>

              <MessageInput
                conversationId={active.id}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onSend={sendMessage}
                onTyping={sendTyping}
              />
            </>
          )}
        </section>
      )}

      <NewConversationModal open={newOpen} onOpenChange={setNewOpen} onCreated={(id) => navigate(`/chat/${id}`)} />
    </div>
  );
}
