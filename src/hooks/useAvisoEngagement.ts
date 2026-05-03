import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const REACTION_EMOJIS = ["👍", "❤️", "😊", "⚠️", "🙏"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export type AvisoComment = {
  id: string;
  aviso_id: string;
  user_id: string;
  parent_comment_id: string | null;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  author?: { nome: string | null; avatar_url: string | null; cargo: string | null } | null;
  replies?: AvisoComment[];
};

export function useAvisoReactions(avisoId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["aviso-reactions", avisoId],
    enabled: !!avisoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aviso_reactions")
        .select("emoji,user_id")
        .eq("aviso_id", avisoId!);
      if (error) throw error;
      const counts = {} as Record<string, number>;
      const mine = new Set<string>();
      (data ?? []).forEach((r) => {
        counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
        if (r.user_id === user?.id) mine.add(r.emoji);
      });
      return { counts, mine, total: data?.length ?? 0 };
    },
  });

  useEffect(() => {
    if (!avisoId) return;
    const channel = supabase
      .channel(`aviso-reactions-${avisoId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "aviso_reactions", filter: `aviso_id=eq.${avisoId}` }, () => {
        qc.invalidateQueries({ queryKey: ["aviso-reactions", avisoId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [avisoId, qc]);

  const toggle = useMutation({
    mutationFn: async (emoji: ReactionEmoji) => {
      if (!user || !avisoId) throw new Error("not ready");
      const has = query.data?.mine.has(emoji);
      if (has) {
        const { error } = await supabase
          .from("aviso_reactions").delete()
          .eq("aviso_id", avisoId).eq("user_id", user.id).eq("emoji", emoji);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("aviso_reactions")
          .insert({ aviso_id: avisoId, user_id: user.id, emoji });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aviso-reactions", avisoId] }),
  });

  return { ...query, toggle };
}

export function useAvisoComments(avisoId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["aviso-comments", avisoId],
    enabled: !!avisoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aviso_comments")
        .select("*")
        .eq("aviso_id", avisoId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((c: any) => c.user_id)));
      const profilesMap: Record<string, { nome: string | null; avatar_url: string | null; cargo: string | null }> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id,nome,avatar_url,cargo")
          .in("user_id", ids);
        (profs ?? []).forEach((p: any) => { profilesMap[p.user_id] = { nome: p.nome, avatar_url: p.avatar_url, cargo: p.cargo }; });
      }
      const all: AvisoComment[] = (data ?? []).map((c: any) => ({ ...c, author: profilesMap[c.user_id] ?? null, replies: [] }));
      const map = new Map(all.map((c) => [c.id, c]));
      const roots: AvisoComment[] = [];
      all.forEach((c) => {
        if (c.parent_comment_id && map.has(c.parent_comment_id)) {
          map.get(c.parent_comment_id)!.replies!.push(c);
        } else {
          roots.push(c);
        }
      });
      return { roots, total: all.filter((c) => !c.deleted_at).length };
    },
  });

  useEffect(() => {
    if (!avisoId) return;
    const channel = supabase
      .channel(`aviso-comments-${avisoId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "aviso_comments", filter: `aviso_id=eq.${avisoId}` }, () => {
        qc.invalidateQueries({ queryKey: ["aviso-comments", avisoId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [avisoId, qc]);

  return query;
}

export function useAvisoEngagementCounts(avisoIds: string[]) {
  return useQuery({
    queryKey: ["aviso-engagement-counts", avisoIds.slice().sort().join(",")],
    enabled: avisoIds.length > 0,
    queryFn: async () => {
      const [{ data: rx }, { data: cm }] = await Promise.all([
        supabase.from("aviso_reactions").select("aviso_id").in("aviso_id", avisoIds),
        supabase.from("aviso_comments").select("aviso_id,deleted_at").in("aviso_id", avisoIds),
      ]);
      const map: Record<string, { reactions: number; comments: number }> = {};
      avisoIds.forEach((id) => { map[id] = { reactions: 0, comments: 0 }; });
      (rx ?? []).forEach((r: any) => { if (map[r.aviso_id]) map[r.aviso_id].reactions++; });
      (cm ?? []).forEach((c: any) => { if (map[c.aviso_id] && !c.deleted_at) map[c.aviso_id].comments++; });
      return map;
    },
  });
}
