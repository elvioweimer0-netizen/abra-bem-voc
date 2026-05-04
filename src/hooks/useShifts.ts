import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Shift = {
  id: string;
  user_id: string;
  unit_id: string;
  setor: string | null;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  role_in_shift: string | null;
  status: "agendado" | "realizado" | "falta" | "folga";
  notes: string | null;
};

export function useShifts(unitId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["shifts", unitId, from, to],
    enabled: !!unitId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("shifts")
        .select("*")
        .eq("unit_id", unitId)
        .gte("shift_date", from)
        .lte("shift_date", to)
        .order("shift_date")
        .order("shift_start");
      if (error) throw error;
      return (data ?? []) as Shift[];
    },
  });
}
