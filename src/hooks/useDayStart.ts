import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MyDayOverview = {
  user_id: string;
  nome: string | null;
  unit_id: string | null;
  mood_avg_today: number | null;
  checklist_pendente_count: number;
  ocorrencias_abertas_count: number;
  aniversariantes_hoje: Array<{ nome: string; user_id: string }>;
  ultimo_curio_ouro: { mensagem: string; criado_em: string; autor_id: string } | null;
  top_acoes: Array<{ tipo: string; titulo: string; href: string }>;
  day_started_today: boolean;
  day_started_at: string | null;
  error?: string;
};

export function useMyDayOverview() {
  const { user } = useAuth();
  return useQuery<MyDayOverview | null>({
    queryKey: ["my-day-overview", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_my_day_overview" as any);
      if (error) throw error;
      return data as MyDayOverview;
    },
  });
}

export function useStartMyDay() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (snapshot: unknown) => {
      if (!user?.id) throw new Error("not authenticated");
      const { data: profile } = await supabase
        .from("profiles")
        .select("unit_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const { error } = await supabase.from("day_starts" as any).insert({
        user_id: user.id,
        unit_id: profile?.unit_id ?? null,
        snapshot: (snapshot as any) ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-day-overview"] });
    },
  });
}
