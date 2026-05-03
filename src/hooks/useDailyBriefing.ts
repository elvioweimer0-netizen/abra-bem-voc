import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const today = () => new Date().toISOString().slice(0, 10);

export type BriefingAlert = { severity: "info" | "warn" | "crit"; label: string; link?: string };
export type BriefingSuggestion = { title: string; action_label: string; link: string };

export type CuriozinhoBriefing = {
  id: string;
  user_id: string;
  briefing_date: string;
  content_markdown: string;
  alerts: BriefingAlert[];
  suggestions: BriefingSuggestion[];
  data_snapshot: Record<string, unknown> | null;
  opened_at: string | null;
  helpful: boolean | null;
  created_at: string;
};

export function useDailyBriefing() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["curiozinho-briefing", user?.id, today()],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curiozinho_briefings" as any)
        .select("*")
        .eq("user_id", user!.id)
        .eq("briefing_date", today())
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as CuriozinhoBriefing) ?? null;
    },
  });

  const markOpened = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("curiozinho_briefings" as any).update({ opened_at: new Date().toISOString() }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["curiozinho-briefing"] }),
  });

  const markHelpful = useMutation({
    mutationFn: async ({ id, helpful }: { id: string; helpful: boolean }) => {
      await supabase.from("curiozinho_briefings" as any).update({ helpful }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["curiozinho-briefing"] }),
  });

  return { ...query, markOpened, markHelpful };
}
