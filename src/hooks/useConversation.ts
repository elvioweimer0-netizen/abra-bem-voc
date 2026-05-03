import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ChatMessage = {
  id: string;
  conversation_id: string;
  author_user_id: string | null;
  content: string | null;
  media_url: string | null;
  media_type: "image" | "video" | "audio" | "document" | null;
  reply_to_message_id: string | null;
  pinned: boolean;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  author_name?: string | null;
  author_foto?: string | null;
  reactions?: Array<{ emoji: string; user_id: string }>;
  read_count?: number;
  status?: "sending" | "sent" | "failed";
};

export function useConversation(conversationId: string | null) {
  const { profile } = useAuth();
  const uid = profile?.user_id;
  const qc = useQueryClient();
  const [optimistic, setOptimistic] = useState<ChatMessage[]>([]);

  const query = useQuery({
    queryKey: ["chat-messages", conversationId],
    enabled: !!conversationId && !!uid,
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("chat_messages" as any)
        .select("*, author:profiles!chat_messages_author_user_id_fkey(nome, foto_url), reactions:chat_message_reactions(emoji, user_id), reads:chat_message_reads(user_id)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data as any[]).map((m) => ({
        id: m.id, conversation_id: m.conversation_id, author_user_id: m.author_user_id,
        content: m.content, media_url: m.media_url, media_type: m.media_type,
        reply_to_message_id: m.reply_to_message_id, pinned: m.pinned,
        created_at: m.created_at, edited_at: m.edited_at, deleted_at: m.deleted_at,
        author_name: m.author?.nome ?? null, author_foto: m.author?.foto_url ?? null,
        reactions: m.reactions ?? [], read_count: (m.reads ?? []).length,
        status: "sent",
      }));
    },
  });

  // Realtime subscribe
  useEffect(() => {
    if (!conversationId) return;
    const ch = supabase
      .channel(`chat-conv-${conversationId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversationId}` },
        () => { qc.invalidateQueries({ queryKey: ["chat-messages", conversationId] }); })
      .on("postgres_changes",
        { event: "*", schema: "public", table: "chat_message_reactions" },
        () => { qc.invalidateQueries({ queryKey: ["chat-messages", conversationId] }); })
      .on("postgres_changes",
        { event: "*", schema: "public", table: "chat_message_reads" },
        () => { qc.invalidateQueries({ queryKey: ["chat-messages", conversationId] }); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, qc]);

  // Mark read on open
  useEffect(() => {
    if (!conversationId || !uid) return;
    supabase.rpc("chat_mark_read" as any, { _conv: conversationId }).then(() => {
      qc.invalidateQueries({ queryKey: ["chat-conversations", uid] });
    });
  }, [conversationId, uid, qc, query.data?.length]);

  const sendMessage = useCallback(async (params: {
    content?: string;
    replyTo?: string | null;
    media?: { url: string; type: "image" | "video" | "audio" | "document" } | null;
  }) => {
    if (!conversationId || !uid) return;
    const tempId = `tmp-${crypto.randomUUID()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId, conversation_id: conversationId, author_user_id: uid,
      content: params.content ?? null, media_url: params.media?.url ?? null,
      media_type: params.media?.type ?? null, reply_to_message_id: params.replyTo ?? null,
      pinned: false, created_at: new Date().toISOString(), edited_at: null, deleted_at: null,
      author_name: profile?.nome ?? null, author_foto: (profile as any)?.foto_url ?? null,
      reactions: [], read_count: 0, status: "sending",
    };
    setOptimistic((arr) => [...arr, optimisticMsg]);
    const { error } = await supabase.from("chat_messages" as any).insert({
      conversation_id: conversationId,
      author_user_id: uid,
      content: params.content ?? null,
      media_url: params.media?.url ?? null,
      media_type: params.media?.type ?? null,
      reply_to_message_id: params.replyTo ?? null,
    });
    setOptimistic((arr) => arr.filter((m) => m.id !== tempId));
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["chat-messages", conversationId] });
  }, [conversationId, uid, profile, qc]);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!uid) return;
    const existing = (query.data ?? []).find((m) => m.id === messageId)?.reactions?.find((r) => r.user_id === uid && r.emoji === emoji);
    if (existing) {
      await supabase.from("chat_message_reactions" as any).delete().eq("message_id", messageId).eq("user_id", uid).eq("emoji", emoji);
    } else {
      await supabase.from("chat_message_reactions" as any).insert({ message_id: messageId, user_id: uid, emoji });
    }
  }, [uid, query.data]);

  const deleteMessage = useCallback(async (messageId: string) => {
    await supabase.from("chat_messages" as any).update({ deleted_at: new Date().toISOString() }).eq("id", messageId);
  }, []);

  const messages = [...(query.data ?? []), ...optimistic];
  return { messages, isLoading: query.isLoading, sendMessage, toggleReaction, deleteMessage };
}
