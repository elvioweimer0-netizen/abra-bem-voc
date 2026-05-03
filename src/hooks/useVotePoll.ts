import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useVotePoll() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      if (!user?.id) throw new Error("Não autenticado");
      const { error } = await (supabase as any)
        .from("poll_votes")
        .insert({ poll_id: pollId, user_id: user.id, option_id: optionId });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success("Voto registrado");
      qc.invalidateQueries({ queryKey: ["poll-my-vote", vars.pollId] });
      qc.invalidateQueries({ queryKey: ["poll-results", vars.pollId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao votar"),
  });
}

export interface CreatePollInput {
  question: string;
  options: { id: string; label: string }[];
  hours: number;
  target_roles: string[];
  unit_id: string | null;
}

export function useCreatePoll() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (input: CreatePollInput) => {
      if (!user?.id) throw new Error("Não autenticado");
      const expires = new Date(Date.now() + input.hours * 3600_000).toISOString();
      const { data, error } = await (supabase as any)
        .from("polls")
        .insert({
          author_user_id: user.id,
          unit_id: input.unit_id ?? (profile as any)?.unit_id ?? null,
          question: input.question.trim(),
          options: input.options,
          expires_at: expires,
          target_roles: input.target_roles,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Enquete criada");
      qc.invalidateQueries({ queryKey: ["polls"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao criar enquete"),
  });
}

export function useClosePoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pollId: string) => {
      const { error } = await (supabase as any).from("polls").update({ status: "encerrada" }).eq("id", pollId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Enquete encerrada");
      qc.invalidateQueries({ queryKey: ["polls"] });
      qc.invalidateQueries({ queryKey: ["poll"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
}
