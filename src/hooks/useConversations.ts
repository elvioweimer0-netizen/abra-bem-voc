import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ConversationListItem = {
  id: string;
  type: "direct" | "group" | "channel" | "unit_auto" | "setor_auto";
  name: string | null;
  image_url: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread: number;
  muted: boolean;
  archived: boolean;
  // for direct conversations
  other_user_id?: string | null;
  other_name?: string | null;
  other_foto?: string | null;
};

export function useConversations() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const uid = profile?.user_id;

  const query = useQuery({
    queryKey: ["chat-conversations", uid],
    enabled: !!uid,
    queryFn: async (): Promise<ConversationListItem[]> => {
      if (!uid) return [];
      const { data: parts, error } = await supabase
        .from("chat_participants" as any)
        .select("conversation_id, last_read_at, joined_at, muted, archived, conversation:chat_conversations(*)")
        .eq("user_id", uid);
      if (error) throw error;
      const list: ConversationListItem[] = [];
      for (const p of (parts ?? []) as any[]) {
        const c = p.conversation;
        if (!c) continue;
        const since = p.last_read_at || p.joined_at;
        const { count } = await supabase
          .from("chat_messages" as any)
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .neq("author_user_id", uid)
          .is("deleted_at", null)
          .gt("created_at", since);
        let other_user_id: string | null = null;
        let other_name: string | null = null;
        let other_foto: string | null = null;
        if (c.type === "direct") {
          const { data: others } = await supabase
            .from("chat_participants" as any)
            .select("user_id, profile:profiles!chat_participants_user_id_fkey(nome, foto_url)")
            .eq("conversation_id", c.id)
            .neq("user_id", uid)
            .maybeSingle();
          if (others) {
            other_user_id = (others as any).user_id;
            other_name = (others as any).profile?.nome ?? null;
            other_foto = (others as any).profile?.foto_url ?? null;
          }
        }
        list.push({
          id: c.id, type: c.type, name: c.name, image_url: c.image_url,
          last_message_at: c.last_message_at, last_message_preview: c.last_message_preview,
          unread: count ?? 0, muted: p.muted, archived: p.archived,
          other_user_id, other_name, other_foto,
        });
      }
      list.sort((a, b) => +new Date(b.last_message_at) - +new Date(a.last_message_at));
      return list;
    },
    staleTime: 10_000,
  });

  // Realtime: invalidate on any chat_messages insert
  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel(`chat-inbox-${uid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
        qc.invalidateQueries({ queryKey: ["chat-conversations", uid] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_participants" }, () => {
        qc.invalidateQueries({ queryKey: ["chat-conversations", uid] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid, qc]);

  const totalUnread = (query.data ?? []).reduce((s, c) => s + (c.muted ? 0 : c.unread), 0);
  return { ...query, totalUnread };
}

export function useChatUnreadBadge() {
  const { totalUnread } = useConversations();
  return totalUnread;
}
