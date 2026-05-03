import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useChatPresence(conversationId: string | null) {
  const { profile } = useAuth();
  const [online, setOnline] = useState<Record<string, boolean>>({});
  const [typing, setTyping] = useState<Record<string, string>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!conversationId || !profile?.user_id) return;
    const ch = supabase.channel(`presence-${conversationId}`, {
      config: { presence: { key: profile.user_id } },
    });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      const next: Record<string, boolean> = {};
      Object.keys(state).forEach((k) => { next[k] = true; });
      setOnline(next);
    });
    ch.on("broadcast", { event: "typing" }, ({ payload }) => {
      const { user_id, name } = payload as { user_id: string; name: string };
      if (user_id === profile.user_id) return;
      setTyping((t) => ({ ...t, [user_id]: name }));
      clearTimeout(typingTimeouts.current[user_id]);
      typingTimeouts.current[user_id] = setTimeout(() => {
        setTyping((t) => { const n = { ...t }; delete n[user_id]; return n; });
      }, 3000);
    });
    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") await ch.track({ at: Date.now() });
    });
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); channelRef.current = null; };
  }, [conversationId, profile?.user_id]);

  const sendTyping = () => {
    if (!channelRef.current || !profile?.user_id) return;
    channelRef.current.send({ type: "broadcast", event: "typing", payload: { user_id: profile.user_id, name: profile.nome } });
  };

  return { online, typing, sendTyping };
}
