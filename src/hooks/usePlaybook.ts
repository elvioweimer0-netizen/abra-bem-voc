import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export type PlaybookCategory = {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  description: string | null;
  ordem: number;
  active: boolean;
};

export type PlaybookArticle = {
  id: string;
  category_id: string;
  title: string;
  context: string;
  script: string | null;
  what_not_to_do: string | null;
  real_example: string | null;
  video_url: string | null;
  tags: string[];
  visible_to: string[];
  created_by: string | null;
  version: number;
  active: boolean;
  featured_until: string | null;
  created_at: string;
  updated_at: string;
};

export function usePlaybookCategories() {
  return useQuery({
    queryKey: ["playbook-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playbook_categories")
        .select("*")
        .eq("active", true)
        .order("ordem");
      if (error) throw error;
      return data as PlaybookCategory[];
    },
  });
}

export function usePlaybookCategoriesAll() {
  return useQuery({
    queryKey: ["playbook-categories-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playbook_categories")
        .select("*")
        .order("ordem");
      if (error) throw error;
      return data as PlaybookCategory[];
    },
  });
}

export function usePlaybookArticles(opts?: { categoryId?: string | null; search?: string; includeInactive?: boolean }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["playbook-articles", opts?.categoryId ?? null, opts?.search ?? "", !!opts?.includeInactive],
    queryFn: async () => {
      let q = supabase.from("playbook_articles").select("*").order("updated_at", { ascending: false });
      if (!opts?.includeInactive) q = q.eq("active", true);
      if (opts?.categoryId) q = q.eq("category_id", opts.categoryId);
      if (opts?.search && opts.search.trim()) q = q.ilike("title", `%${opts.search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      const articles = (data ?? []) as PlaybookArticle[];
      let viewedIds = new Set<string>();
      if (user && articles.length) {
        const { data: views } = await supabase
          .from("playbook_article_views")
          .select("article_id")
          .eq("user_id", user.id)
          .in("article_id", articles.map((a) => a.id));
        viewedIds = new Set((views ?? []).map((v: any) => v.article_id));
      }
      return articles.map((a) => ({ ...a, viewed: viewedIds.has(a.id) }));
    },
  });
}

export function usePlaybookArticle(articleId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["playbook-article", articleId],
    enabled: !!articleId,
    queryFn: async () => {
      const { data, error } = await supabase.from("playbook_articles").select("*").eq("id", articleId!).maybeSingle();
      if (error) throw error;
      return data as PlaybookArticle | null;
    },
  });

  const feedbackQuery = useQuery({
    queryKey: ["playbook-article-feedback", articleId, user?.id],
    enabled: !!articleId && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("playbook_article_feedback")
        .select("*")
        .eq("article_id", articleId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as { useful: boolean | null; comment: string | null } | null;
    },
  });

  // mark view once
  useEffect(() => {
    if (!articleId || !user) return;
    supabase
      .from("playbook_article_views")
      .insert({ article_id: articleId, user_id: user.id })
      .then(() => qc.invalidateQueries({ queryKey: ["playbook-articles"] }));
  }, [articleId, user, qc]);

  return { ...query, feedback: feedbackQuery.data };
}

export function useSubmitFeedback() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { articleId: string; useful: boolean | null; comment?: string }) => {
      if (!user) throw new Error("not authed");
      const { error } = await supabase
        .from("playbook_article_feedback")
        .upsert(
          { article_id: input.articleId, user_id: user.id, useful: input.useful, comment: input.comment ?? null },
          { onConflict: "article_id,user_id" },
        );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["playbook-article-feedback", vars.articleId] });
    },
  });
}

export function usePlaybookSuggestion() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["playbook-suggestion", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: views } = await supabase
        .from("playbook_article_views")
        .select("article_id, viewed_at, playbook_articles!inner(category_id)")
        .eq("user_id", user!.id)
        .order("viewed_at", { ascending: false })
        .limit(1);
      const lastCat = (views?.[0] as any)?.playbook_articles?.category_id ?? null;

      const { data: viewed } = await supabase
        .from("playbook_article_views")
        .select("article_id")
        .eq("user_id", user!.id);
      const viewedIds = new Set((viewed ?? []).map((v: any) => v.article_id));

      let q = supabase.from("playbook_articles").select("*").eq("active", true).limit(20);
      if (lastCat) q = q.eq("category_id", lastCat);
      const { data: candidates } = await q;
      const fresh = (candidates ?? []).filter((a: any) => !viewedIds.has(a.id));
      const pool = fresh.length ? fresh : candidates ?? [];
      if (!pool.length) return null;
      return pool[Math.floor(Math.random() * pool.length)] as PlaybookArticle;
    },
  });
}

export function useSaveArticle() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PlaybookArticle> & { id?: string }) => {
      if (!user) throw new Error("not authed");
      const payload: any = { ...input };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.version;
      if (input.id) {
        const { error } = await supabase.from("playbook_articles").update(payload).eq("id", input.id);
        if (error) throw error;
        return input.id;
      } else {
        payload.created_by = user.id;
        const { data, error } = await supabase.from("playbook_articles").insert(payload).select("id").single();
        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playbook-articles"] });
      qc.invalidateQueries({ queryKey: ["playbook-article"] });
    },
  });
}

export function useToggleArticleActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; active: boolean }) => {
      const { error } = await supabase.from("playbook_articles").update({ active: input.active }).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playbook-articles"] }),
  });
}

export function useToggleFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; featured: boolean }) => {
      const featured_until = input.featured ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;
      const { error } = await supabase.from("playbook_articles").update({ featured_until }).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playbook-articles"] }),
  });
}

export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PlaybookCategory> & { id?: string }) => {
      const payload: any = { ...input };
      delete payload.id;
      if (input.id) {
        const { error } = await supabase.from("playbook_categories").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("playbook_categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playbook-categories"] }),
  });
}

export function usePlaybookStats() {
  return useQuery({
    queryKey: ["playbook-stats"],
    queryFn: async () => {
      const { data: views } = await supabase.from("playbook_article_views").select("article_id");
      const { data: fb } = await supabase.from("playbook_article_feedback").select("article_id, useful");
      const { data: arts } = await supabase.from("playbook_articles").select("id, title");
      const viewCount: Record<string, number> = {};
      (views ?? []).forEach((v: any) => (viewCount[v.article_id] = (viewCount[v.article_id] ?? 0) + 1));
      const usefulCount: Record<string, number> = {};
      const fbCount: Record<string, number> = {};
      (fb ?? []).forEach((f: any) => {
        fbCount[f.article_id] = (fbCount[f.article_id] ?? 0) + 1;
        if (f.useful) usefulCount[f.article_id] = (usefulCount[f.article_id] ?? 0) + 1;
      });
      const articles = (arts ?? []) as Array<{ id: string; title: string }>;
      const mostViewed = [...articles].sort((a, b) => (viewCount[b.id] ?? 0) - (viewCount[a.id] ?? 0)).slice(0, 5)
        .map((a) => ({ ...a, count: viewCount[a.id] ?? 0 }));
      const mostUseful = [...articles].sort((a, b) => (usefulCount[b.id] ?? 0) - (usefulCount[a.id] ?? 0)).slice(0, 5)
        .map((a) => ({ ...a, count: usefulCount[a.id] ?? 0 }));
      const noFeedback = articles.filter((a) => !fbCount[a.id]);
      return { mostViewed, mostUseful, noFeedback };
    },
  });
}
