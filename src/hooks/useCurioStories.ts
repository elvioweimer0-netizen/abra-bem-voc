import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type StoryStatus = "pendente" | "aprovada" | "rejeitada" | "arquivada";

export type CurioStory = {
  id: string;
  author_user_id: string;
  value_id: string | null;
  title: string;
  content: string;
  image_url: string | null;
  status: StoryStatus;
  moderated_by: string | null;
  moderated_at: string | null;
  moderation_note: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: { nome: string | null; foto_url: string | null } | null;
  value?: { id: string; name: string; code: string; color: string | null } | null;
  likes_count?: number;
  liked_by_me?: boolean;
};

async function enrichLikes(stories: any[], userId?: string): Promise<CurioStory[]> {
  if (!stories.length) return [];
  const ids = stories.map((s) => s.id);
  const { data: likes } = await supabase
    .from("curio_story_likes")
    .select("story_id, user_id")
    .in("story_id", ids);
  const counts = new Map<string, number>();
  const mine = new Set<string>();
  (likes ?? []).forEach((l: any) => {
    counts.set(l.story_id, (counts.get(l.story_id) ?? 0) + 1);
    if (userId && l.user_id === userId) mine.add(l.story_id);
  });
  return stories.map((s) => ({
    ...s,
    likes_count: counts.get(s.id) ?? 0,
    liked_by_me: mine.has(s.id),
  }));
}

const SELECT = "*, author:profiles!curio_stories_author_user_id_fkey(nome,foto_url), value:culture_values(id,name,code,color)";

export function useApprovedStories(filters: { valueId?: string; search?: string; page?: number; pageSize?: number } = {}) {
  const { user } = useAuth();
  const { valueId, search, page = 0, pageSize = 12 } = filters;
  return useQuery({
    queryKey: ["curio_stories_approved", valueId ?? "all", search ?? "", page, user?.id],
    queryFn: async () => {
      let q = supabase
        .from("curio_stories")
        .select(SELECT, { count: "exact" })
        .eq("status", "aprovada")
        .order("published_at", { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);
      if (valueId) q = q.eq("value_id", valueId);
      if (search && search.trim()) q = q.ilike("title", `%${search.trim()}%`);
      const { data, error, count } = await q;
      if (error) throw error;
      const enriched = await enrichLikes(data ?? [], user?.id);
      return { items: enriched, total: count ?? 0 };
    },
  });
}

export function useMyStories() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user?.id,
    queryKey: ["curio_stories_mine", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curio_stories")
        .select(SELECT)
        .eq("author_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CurioStory[];
    },
  });
}

export function useModerationStories(status: StoryStatus) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["curio_stories_mod", status, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curio_stories")
        .select(SELECT)
        .eq("status", status)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CurioStory[];
    },
  });
}

export function useStoryOfTheWeek() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["curio_story_week", user?.id],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const { data, error } = await supabase
        .from("curio_stories")
        .select(SELECT)
        .eq("status", "aprovada")
        .gte("published_at", since.toISOString())
        .order("published_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      const enriched = await enrichLikes(data ?? [], user?.id);
      enriched.sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0));
      return enriched[0] ?? null;
    },
  });
}

export function useHallDoMes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["curio_story_hall", user?.id],
    queryFn: async () => {
      const since = new Date();
      since.setDate(1);
      since.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("curio_stories")
        .select(SELECT)
        .eq("status", "aprovada")
        .gte("published_at", since.toISOString());
      if (error) throw error;
      const enriched = await enrichLikes(data ?? [], user?.id);
      enriched.sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0));
      return enriched.slice(0, 5);
    },
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ storyId, liked }: { storyId: string; liked: boolean }) => {
      if (!user?.id) throw new Error("Não autenticado");
      if (liked) {
        const { error } = await supabase
          .from("curio_story_likes")
          .delete()
          .eq("story_id", storyId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("curio_story_likes")
          .insert({ story_id: storyId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["curio_stories_approved"] });
      qc.invalidateQueries({ queryKey: ["curio_story_week"] });
      qc.invalidateQueries({ queryKey: ["curio_story_hall"] });
    },
  });
}

export function useCreateStory() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { title: string; content: string; value_id: string | null; imageFile?: File | null }) => {
      if (!user?.id) throw new Error("Não autenticado");
      const { data: created, error } = await supabase
        .from("curio_stories")
        .insert({
          author_user_id: user.id,
          title: input.title.trim(),
          content: input.content.trim(),
          value_id: input.value_id,
        })
        .select()
        .single();
      if (error) throw error;
      let image_url: string | null = null;
      if (input.imageFile) {
        const ext = input.imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${created.id}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("curio-stories")
          .upload(path, input.imageFile, { upsert: true, contentType: input.imageFile.type });
        if (upErr) throw upErr;
        image_url = path;
        await supabase.from("curio_stories").update({ image_url }).eq("id", created.id);
      }
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["curio_stories_mine"] });
      qc.invalidateQueries({ queryKey: ["curio_stories_mod"] });
    },
  });
}

export function useModerateStory() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: "aprovada" | "rejeitada" | "arquivada"; note?: string }) => {
      const payload: any = { status, moderated_by: user?.id, moderation_note: note ?? null };
      const { error } = await supabase.from("curio_stories").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["curio_stories_mod"] });
      qc.invalidateQueries({ queryKey: ["curio_stories_approved"] });
    },
  });
}

export async function getStoryImageUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("curio-stories").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
