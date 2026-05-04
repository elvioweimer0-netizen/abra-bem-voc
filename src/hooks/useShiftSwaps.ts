import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useShiftSwaps() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["shift-swaps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("shift_swaps")
        .select("*, shifts:original_shift_id(shift_date, shift_start, shift_end, setor, unit_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateSwap() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: { shiftId: string; swapWith?: string | null; message: string }) => {
      const { error } = await (supabase as any).from("shift_swaps").insert({
        original_shift_id: params.shiftId,
        requester_user_id: user!.id,
        swap_with_user_id: params.swapWith ?? null,
        message: params.message,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift-swaps"] }),
  });
}

export function useRespondSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from("shift_swaps")
        .update({ status: params.status, responded_at: new Date().toISOString() })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift-swaps"] }),
  });
}
