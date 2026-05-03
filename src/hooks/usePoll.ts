import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Poll } from "./usePolls";

export interface PollVote {
  id: string;
  poll_id: string;
  user_id: string;
  option_id: string;
  voted_at: string;
}

export function usePoll(pollId: string | undefined) {
  return useQuery({
    queryKey: ["poll", pollId],
    enabled: !!pollId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("polls")
        .select("*")
        .eq("id", pollId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [{ data: author }, { data: unit }] = await Promise.all([
        supabase.from("profiles").select("user_id, nome, foto_url").eq("user_id", data.author_user_id).maybeSingle(),
        data.unit_id
          ? supabase.from("units").select("id, name").eq("id", data.unit_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      return {
        ...data,
        options: Array.isArray(data.options) ? data.options : [],
        author: author ?? null,
        unit: unit ?? null,
      } as Poll;
    },
    refetchInterval: 15_000,
  });
}

export function useMyVote(pollId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["poll-my-vote", pollId, user?.id],
    enabled: !!pollId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("poll_votes")
        .select("*")
        .eq("poll_id", pollId)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as PollVote | null) ?? null;
    },
  });
}

export function usePollResults(pollId: string | undefined) {
  return useQuery({
    queryKey: ["poll-results", pollId],
    enabled: !!pollId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("poll_votes")
        .select("option_id, user_id")
        .eq("poll_id", pollId);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const v of data ?? []) counts[v.option_id] = (counts[v.option_id] ?? 0) + 1;
      return { counts, total: (data ?? []).length, voterIds: (data ?? []).map((v: any) => v.user_id) };
    },
    refetchInterval: 15_000,
  });
}

export function usePollUnitBreakdown(pollId: string | undefined, voterIds: string[]) {
  return useQuery({
    queryKey: ["poll-unit-breakdown", pollId, voterIds.length],
    enabled: !!pollId && voterIds.length > 0,
    queryFn: async () => {
      const { data: votes } = await (supabase as any).from("poll_votes").select("option_id, user_id").eq("poll_id", pollId);
      const { data: profiles } = await supabase.from("profiles").select("user_id, unit_id").in("user_id", voterIds);
      const { data: units } = await supabase.from("units").select("id, name");
      const unitMap = new Map((units ?? []).map((u: any) => [u.id, u.name]));
      const profMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p.unit_id]));
      // unit -> option -> count
      const breakdown: Record<string, Record<string, number>> = {};
      for (const v of votes ?? []) {
        const unitId = profMap.get(v.user_id);
        const unitName = unitId ? unitMap.get(unitId) ?? "Sem unidade" : "Sem unidade";
        breakdown[unitName] = breakdown[unitName] ?? {};
        breakdown[unitName][v.option_id] = (breakdown[unitName][v.option_id] ?? 0) + 1;
      }
      return breakdown;
    },
  });
}
