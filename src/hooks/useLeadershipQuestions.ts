import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type LeadershipQuestion = {
  id: string;
  week_start_date: string;
  question_text: string;
  context_note: string | null;
  target_roles: string[];
  deadline_date: string;
  created_by: string | null;
  created_at: string;
  active: boolean;
};

export type LeadershipAnswer = {
  id: string;
  question_id: string;
  user_id: string;
  answer_text: string;
  submitted_at: string;
  edited_at: string | null;
  author?: { nome: string; foto_url: string | null; cargo_titulo: string | null } | null;
};

export type AnswerComment = {
  id: string;
  answer_id: string;
  author_user_id: string;
  comment_text: string;
  created_at: string;
  author?: { nome: string; foto_url: string | null } | null;
};

function isoMondayOfWeek(d = new Date()) {
  const day = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day - 1));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export function deadlinePassed(q: { deadline_date: string }) {
  const dl = new Date(q.deadline_date + "T23:59:59");
  return new Date() > dl;
}

export function useCurrentLeadershipQuestion() {
  return useQuery({
    queryKey: ["leadership-question-current"],
    queryFn: async () => {
      const monday = isoMondayOfWeek();
      const { data, error } = await supabase
        .from("leadership_questions")
        .select("*")
        .eq("active", true)
        .lte("week_start_date", monday)
        .order("week_start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as LeadershipQuestion | null;
    },
  });
}

export function useLeadershipQuestionHistory(opts?: { from?: string; to?: string; authorId?: string }) {
  return useQuery({
    queryKey: ["leadership-questions-history", opts],
    queryFn: async () => {
      let q = supabase.from("leadership_questions").select("*").order("week_start_date", { ascending: false });
      if (opts?.from) q = q.gte("week_start_date", opts.from);
      if (opts?.to) q = q.lte("week_start_date", opts.to);
      if (opts?.authorId) q = q.eq("created_by", opts.authorId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as LeadershipQuestion[];
    },
  });
}

export function useLeadershipQuestion(id: string | undefined) {
  return useQuery({
    queryKey: ["leadership-question", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("leadership_questions").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as LeadershipQuestion | null;
    },
  });
}

export function useMyAnswer(questionId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["leadership-answer-mine", questionId, user?.id],
    enabled: !!questionId && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("leadership_answers")
        .select("*")
        .eq("question_id", questionId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as LeadershipAnswer | null;
    },
  });
}

export function useLeadershipAnswers(questionId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["leadership-answers", questionId, user?.id],
    enabled: !!questionId,
    queryFn: async () => {
      // RLS gates anti-contagion
      const { data, error } = await supabase
        .from("leadership_answers")
        .select("*")
        .eq("question_id", questionId!)
        .order("submitted_at", { ascending: true });
      if (error) throw error;
      const answers = (data ?? []) as LeadershipAnswer[];
      const userIds = Array.from(new Set(answers.map((a) => a.user_id)));
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, nome, foto_url, cargo_titulo")
          .in("user_id", userIds);
        const map = Object.fromEntries((profiles ?? []).map((p: any) => [p.user_id, p]));
        return answers.map((a) => ({ ...a, author: map[a.user_id] ?? null }));
      }
      return answers;
    },
  });
}

export function useSubmitAnswer() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { questionId: string; text: string }) => {
      if (!user) throw new Error("not authed");
      const { error } = await supabase.from("leadership_answers").insert({
        question_id: input.questionId,
        user_id: user.id,
        answer_text: input.text,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["leadership-answer-mine", vars.questionId] });
      qc.invalidateQueries({ queryKey: ["leadership-answers", vars.questionId] });
    },
  });
}

export function useEditAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; text: string }) => {
      const { error } = await supabase
        .from("leadership_answers")
        .update({ answer_text: input.text, edited_at: new Date().toISOString() })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadership-answer-mine"] });
      qc.invalidateQueries({ queryKey: ["leadership-answers"] });
    },
  });
}

export function useAnswerComments(answerId: string | undefined) {
  return useQuery({
    queryKey: ["leadership-answer-comments", answerId],
    enabled: !!answerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leadership_answer_comments")
        .select("*")
        .eq("answer_id", answerId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const comments = (data ?? []) as AnswerComment[];
      const ids = Array.from(new Set(comments.map((c) => c.author_user_id)));
      if (!ids.length) return comments;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nome, foto_url")
        .in("user_id", ids);
      const map = Object.fromEntries((profiles ?? []).map((p: any) => [p.user_id, p]));
      return comments.map((c) => ({ ...c, author: map[c.author_user_id] ?? null }));
    },
  });
}

export function useAddComment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { answerId: string; text: string }) => {
      if (!user) throw new Error("not authed");
      const { error } = await supabase.from("leadership_answer_comments").insert({
        answer_id: input.answerId,
        author_user_id: user.id,
        comment_text: input.text,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["leadership-answer-comments", vars.answerId] }),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; answerId: string }) => {
      const { error } = await supabase.from("leadership_answer_comments").delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["leadership-answer-comments", vars.answerId] }),
  });
}

export function useSaveQuestion() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<LeadershipQuestion> & { id?: string }) => {
      if (!user) throw new Error("not authed");
      const payload: any = { ...input };
      delete payload.id;
      delete payload.created_at;
      if (input.id) {
        const { error } = await supabase.from("leadership_questions").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        payload.created_by = user.id;
        const { error } = await supabase.from("leadership_questions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadership-questions-history"] });
      qc.invalidateQueries({ queryKey: ["leadership-question-current"] });
    },
  });
}

export function useAdminQuestionStats(questionId: string | undefined) {
  return useQuery({
    queryKey: ["leadership-question-stats", questionId],
    enabled: !!questionId,
    queryFn: async () => {
      const { data: q } = await supabase.from("leadership_questions").select("target_roles").eq("id", questionId!).maybeSingle();
      const { count: answered } = await supabase
        .from("leadership_answers")
        .select("id", { count: "exact", head: true })
        .eq("question_id", questionId!);
      const { count: eligible } = await supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("ativo", true)
        .in("cargo", (q?.target_roles ?? []) as any);
      return {
        answered: answered ?? 0,
        eligible: eligible ?? 0,
        pct: eligible ? Math.round(((answered ?? 0) / eligible) * 100) : 0,
      };
    },
  });
}
