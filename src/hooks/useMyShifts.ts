import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, addDays } from "date-fns";
import type { Shift } from "./useShifts";

export function useMyShifts(days = 14) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-shifts", user?.id, days],
    enabled: !!user,
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const end = format(addDays(new Date(), days), "yyyy-MM-dd");
      const { data, error } = await (supabase as any)
        .from("shifts")
        .select("*, units(name, code)")
        .eq("user_id", user!.id)
        .gte("shift_date", today)
        .lte("shift_date", end)
        .order("shift_date")
        .order("shift_start");
      if (error) throw error;
      return (data ?? []) as (Shift & { units?: { name: string; code: string } })[];
    },
  });
}
