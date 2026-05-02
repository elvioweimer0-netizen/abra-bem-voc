import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type TrainingModule = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_seconds: number;
  category: string;
  thumbnail_url: string | null;
  ordem: number;
  active: boolean;
  created_at: string;
};

export type ModuleWithStatus = TrainingModule & {
  status: "nao_fez" | "concluido" | "reprovado";
  last_score: number | null;
};

export function useTrainingModules(opts: { includeInactive?: boolean } = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["training-modules", user?.id, opts.includeInactive],
    enabled: !!user,
    queryFn: async (): Promise<ModuleWithStatus[]> => {
      let q = (supabase as any).from("training_modules").select("*").order("ordem", { ascending: true }).order("created_at", { ascending: false });
      if (!opts.includeInactive) q = q.eq("active", true);
      const { data: modules, error } = await q;
      if (error) throw error;

      const { data: completions } = await (supabase as any).from("training_completions").select("module_id, score").eq("user_id", user!.id);
      const { data: attempts } = await (supabase as any).from("training_attempts").select("module_id, score, attempted_at").eq("user_id", user!.id).order("attempted_at", { ascending: false });

      const compMap = new Map<string, number>((completions ?? []).map((c: any) => [c.module_id, Number(c.score)]));
      const lastAttempt = new Map<string, number>();
      for (const a of attempts ?? []) {
        if (!lastAttempt.has(a.module_id)) lastAttempt.set(a.module_id, Number(a.score));
      }

      return (modules ?? []).map((m: any) => {
        if (compMap.has(m.id)) return { ...m, status: "concluido" as const, last_score: compMap.get(m.id)! };
        if (lastAttempt.has(m.id)) return { ...m, status: "reprovado" as const, last_score: lastAttempt.get(m.id)! };
        return { ...m, status: "nao_fez" as const, last_score: null };
      });
    },
  });
}
