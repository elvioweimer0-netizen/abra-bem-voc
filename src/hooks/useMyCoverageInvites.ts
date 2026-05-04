import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Invite = {
  id: string;
  request_id: string;
  invitee_user_id: string;
  status: "pendente" | "aceito" | "recusado" | "cancelado";
  responded_at: string | null;
  created_at: string;
  request?: {
    target_date: string;
    target_shift_start: string;
    target_shift_end: string;
    setor: string | null;
    urgency: string;
    message: string | null;
    requester_unit_id: string;
    status: string;
  };
};

export function useMyCoverageInvites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["coverage-invites", "mine", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: prof } = await (supabase as any)
        .from("profiles").select("id").eq("user_id", user!.id).maybeSingle();
      if (!prof?.id) return [];
      const { data, error } = await (supabase as any)
        .from("coverage_invites")
        .select("id, request_id, invitee_user_id, status, responded_at, created_at, coverage_requests(target_date, target_shift_start, target_shift_end, setor, urgency, message, requester_unit_id, status)")
        .eq("invitee_user_id", prof.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({ ...row, request: row.coverage_requests })) as Invite[];
    },
  });
}

export function useInviteHelpers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { request_id: string; invitee_user_ids: string[] }) => {
      const rows = input.invitee_user_ids.map((id) => ({ request_id: input.request_id, invitee_user_id: id }));
      const { error } = await (supabase as any).from("coverage_invites").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coverage-invites"] }),
  });
}

export function useRespondInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: "aceito" | "recusado" }) => {
      const { error } = await (supabase as any)
        .from("coverage_invites")
        .update({ status: input.status })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coverage-invites"] });
      qc.invalidateQueries({ queryKey: ["coverage-requests"] });
    },
  });
}
