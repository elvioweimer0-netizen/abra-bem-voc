import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Helper = {
  id: string;
  user_id: string;
  nome: string;
  unidade: string;
  unit_id: string | null;
  setor: string | null;
  telefone: string | null;
  email: string;
  foto_url: string | null;
};

/** Returns profiles with available_for_coverage=true that cover target_date and are NOT in the requester's unit. */
export function useAvailableHelpers(targetDate: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["available-helpers", targetDate, user?.id],
    enabled: !!targetDate && !!user?.id,
    queryFn: async () => {
      const { data: me } = await (supabase as any)
        .from("profiles").select("unit_id").eq("user_id", user!.id).maybeSingle();
      const myUnit = me?.unit_id ?? null;

      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, user_id, nome, unidade, unit_id, setor, telefone, email, foto_url, coverage_dates, ativo, available_for_coverage")
        .eq("available_for_coverage", true)
        .eq("ativo", true);
      if (error) throw error;

      const target = new Date(targetDate!);
      const filtered: Helper[] = (data ?? [])
        .filter((p: any) => p.unit_id !== myUnit)
        .filter((p: any) => {
          const ranges: string[] | null = p.coverage_dates;
          if (!ranges || !ranges.length) return true; // no restriction → available
          return ranges.some((r: string) => {
            const m = String(r).match(/^[\[\(]([\d-]+),([\d-]+)[\]\)]$/);
            if (!m) return false;
            const startInc = String(r).startsWith("[");
            const endInc = String(r).endsWith("]");
            const start = new Date(m[1]);
            const end = new Date(m[2]);
            const after = startInc ? target >= start : target > start;
            const before = endInc ? target <= end : target < end;
            return after && before;
          });
        });
      return filtered;
    },
  });
}
