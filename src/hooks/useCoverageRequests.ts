import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type CoverageRequest = {
  id: string;
  requester_gerente_id: string;
  requester_unit_id: string;
  target_date: string;
  target_shift_start: string;
  target_shift_end: string;
  setor: string | null;
  urgency: "alta" | "média" | "baixa";
  status: "aberto" | "aceito" | "recusado" | "cancelado" | "concluido";
  message: string | null;
  accepted_by_user_id: string | null;
  created_at: string;
};

export function useMyCoverageRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["coverage-requests", "mine", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: prof } = await (supabase as any)
        .from("profiles").select("id").eq("user_id", user!.id).maybeSingle();
      if (!prof?.id) return [];
      const { data, error } = await (supabase as any)
        .from("coverage_requests")
        .select("*")
        .eq("requester_gerente_id", prof.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CoverageRequest[];
    },
  });
}

export function useCreateCoverageRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      target_date: string;
      target_shift_start: string;
      target_shift_end: string;
      setor: string | null;
      urgency: "alta" | "média" | "baixa";
      message: string | null;
    }) => {
      const { data: prof } = await (supabase as any)
        .from("profiles").select("id, unit_id").eq("user_id", user!.id).maybeSingle();
      if (!prof?.id || !prof?.unit_id) throw new Error("Perfil/unidade não encontrados");
      const { data, error } = await (supabase as any)
        .from("coverage_requests")
        .insert({
          requester_gerente_id: prof.id,
          requester_unit_id: prof.unit_id,
          ...input,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CoverageRequest;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coverage-requests"] }),
  });
}

export function useUpdateCoverageRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: CoverageRequest["status"] }) => {
      const { error } = await (supabase as any)
        .from("coverage_requests")
        .update({ status: input.status })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coverage-requests"] }),
  });
}
