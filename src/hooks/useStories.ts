import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";

export type Story = {
  id: string;
  author_user_id: string;
  unit_id: string;
  setor: string | null;
  media_url: string;
  media_type: "image" | "video";
  caption: string | null;
  duration_seconds: number;
  created_at: string;
  expires_at: string;
  author?: { nome: string | null; cargo: string | null; cargo_titulo: string | null; foto_url: string | null };
  unit?: { id: string; code: string; name: string };
  signed_url?: string;
};

export type UnitStoryGroup = {
  unit_id: string;
  unit_name: string;
  unit_code: string;
  stories: Story[];
  has_unseen: boolean;
};

async function signUrl(path: string) {
  const { data } = await supabase.storage.from("stories").createSignedUrl(path, 60 * 60);
  return (data as any)?.signedUrl ?? "";
}

export function useActiveStories() {
  const { profile } = useAuth();
  const { data: units } = useAccessibleUnits();
  return useQuery({
    queryKey: ["stories-active", profile?.user_id, units?.map((u) => u.id).join(",")],
    enabled: !!profile && !!units,
    queryFn: async (): Promise<UnitStoryGroup[]> => {
      const { data: rows, error } = await (supabase as any)
        .from("stories")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      const stories = (rows ?? []) as Story[];
      const authorIds = [...new Set(stories.map((s) => s.author_user_id))];
      const unitIds = [...new Set(stories.map((s) => s.unit_id))];
      const [{ data: profs }, { data: unitsData }, { data: views }] = await Promise.all([
        authorIds.length
          ? (supabase as any).from("profiles").select("user_id, nome, cargo, cargo_titulo, foto_url").in("user_id", authorIds)
          : Promise.resolve({ data: [] }),
        unitIds.length
          ? (supabase as any).from("units").select("id, code, name").in("id", unitIds)
          : Promise.resolve({ data: [] }),
        (supabase as any).from("story_views").select("story_id").eq("viewer_user_id", profile!.user_id),
      ]);
      const profMap = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
      const unitMap = new Map((unitsData ?? []).map((u: any) => [u.id, u]));
      const seenSet = new Set((views ?? []).map((v: any) => v.story_id));

      // Sign URLs in parallel
      await Promise.all(
        stories.map(async (s) => {
          s.signed_url = await signUrl(s.media_url);
          s.author = profMap.get(s.author_user_id);
          s.unit = unitMap.get(s.unit_id);
        })
      );

      // Group by unit
      const groups = new Map<string, UnitStoryGroup>();
      for (const s of stories) {
        if (!groups.has(s.unit_id)) {
          const u = unitMap.get(s.unit_id) as any;
          groups.set(s.unit_id, {
            unit_id: s.unit_id,
            unit_name: u?.name ?? "Unidade",
            unit_code: u?.code ?? "",
            stories: [],
            has_unseen: false,
          });
        }
        const g = groups.get(s.unit_id)!;
        g.stories.push(s);
        if (!seenSet.has(s.id)) g.has_unseen = true;
      }
      return Array.from(groups.values()).sort((a, b) => Number(b.has_unseen) - Number(a.has_unseen));
    },
  });
}

export function useMarkStoryView() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (storyId: string) => {
      await (supabase as any)
        .from("story_views")
        .upsert({ story_id: storyId, viewer_user_id: profile!.user_id }, { onConflict: "story_id,viewer_user_id" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stories-active"] }),
  });
}

export function useStoryReactions(storyId: string | null) {
  return useQuery({
    queryKey: ["story-reactions", storyId],
    enabled: !!storyId,
    queryFn: async () => {
      const { data } = await (supabase as any).from("story_reactions").select("*").eq("story_id", storyId);
      return data ?? [];
    },
  });
}

export function useReactStory() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ storyId, emoji }: { storyId: string; emoji: string }) => {
      await (supabase as any)
        .from("story_reactions")
        .upsert({ story_id: storyId, user_id: profile!.user_id, emoji }, { onConflict: "story_id,user_id,emoji" });
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["story-reactions", v.storyId] }),
  });
}

export function useStoryViewers(storyId: string | null) {
  return useQuery({
    queryKey: ["story-viewers", storyId],
    enabled: !!storyId,
    queryFn: async () => {
      const { data: views } = await (supabase as any)
        .from("story_views")
        .select("viewer_user_id, viewed_at")
        .eq("story_id", storyId)
        .order("viewed_at", { ascending: false });
      const ids = (views ?? []).map((v: any) => v.viewer_user_id);
      if (!ids.length) return [];
      const { data: profs } = await (supabase as any)
        .from("profiles")
        .select("user_id, nome, cargo_titulo, foto_url")
        .in("user_id", ids);
      const profMap = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
      return (views ?? []).map((v: any) => ({ ...v, profile: profMap.get(v.viewer_user_id) }));
    },
  });
}

export function useCreateStory() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, caption, unit_id, setor }: { file: File; caption?: string; unit_id: string; setor?: string }) => {
      // validate
      const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
      if (!allowed.includes(file.type)) throw new Error("Tipo de arquivo não suportado");
      if (file.size > 50 * 1024 * 1024) throw new Error("Arquivo maior que 50MB");
      const media_type = file.type.startsWith("video/") ? "video" : "image";
      const ext = file.name.split(".").pop() ?? (media_type === "video" ? "mp4" : "jpg");
      const storyId = crypto.randomUUID();
      const path = `${unit_id}/${profile!.user_id}/${storyId}.${ext}`;
      const { error: upErr } = await supabase.storage.from("stories").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error } = await (supabase as any).from("stories").insert({
        id: storyId,
        author_user_id: profile!.user_id,
        unit_id,
        setor: setor ?? null,
        media_url: path,
        media_type,
        caption: caption?.slice(0, 200) || null,
      });
      if (error) {
        await supabase.storage.from("stories").remove([path]);
        throw error;
      }
      return storyId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stories-active"] }),
  });
}

export function useMyStoriesHistory() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["my-stories-history", profile?.user_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("stories")
        .select("*")
        .eq("author_user_id", profile!.user_id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false });
      const list = (data ?? []) as Story[];
      await Promise.all(list.map(async (s) => { s.signed_url = await signUrl(s.media_url); }));
      return list;
    },
  });
}

export function useDeleteStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (story: Story) => {
      await supabase.storage.from("stories").remove([story.media_url]);
      const { error } = await (supabase as any).from("stories").delete().eq("id", story.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stories-active"] });
      qc.invalidateQueries({ queryKey: ["my-stories-history"] });
      qc.invalidateQueries({ queryKey: ["admin-stories"] });
    },
  });
}

export function useAdminAllStories() {
  return useQuery({
    queryKey: ["admin-stories"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      const list = (data ?? []) as Story[];
      const authorIds = [...new Set(list.map((s) => s.author_user_id))];
      const unitIds = [...new Set(list.map((s) => s.unit_id))];
      const [{ data: profs }, { data: unitsData }] = await Promise.all([
        authorIds.length
          ? (supabase as any).from("profiles").select("user_id, nome, cargo_titulo, foto_url").in("user_id", authorIds)
          : Promise.resolve({ data: [] }),
        unitIds.length
          ? (supabase as any).from("units").select("id, code, name").in("id", unitIds)
          : Promise.resolve({ data: [] }),
      ]);
      const profMap = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
      const unitMap = new Map((unitsData ?? []).map((u: any) => [u.id, u]));
      await Promise.all(list.map(async (s) => {
        s.signed_url = await signUrl(s.media_url);
        s.author = profMap.get(s.author_user_id);
        s.unit = unitMap.get(s.unit_id);
      }));
      return list;
    },
  });
}
