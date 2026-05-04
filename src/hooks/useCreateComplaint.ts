import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ComplaintCategory, ComplaintSeverity } from "./useComplaints";

export type CreateComplaintInput = {
  unit_id: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  description: string;
  customer_contact?: string | null;
  action_taken?: string | null;
  setor?: string | null;
};

export function useCreateComplaint() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateComplaintInput) => {
      if (!user?.id) throw new Error("Não autenticado");
      const { data: prof } = await (supabase as any)
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!prof?.id) throw new Error("Perfil não encontrado");

      const { data, error } = await (supabase as any)
        .from("customer_complaints")
        .insert({
          ...input,
          registered_by_user_id: prof.id,
          customer_contact: input.customer_contact?.trim() || null,
          action_taken: input.action_taken?.trim() || null,
          setor: input.setor || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer_complaints"] });
      qc.invalidateQueries({ queryKey: ["complaint_trends"] });
      qc.invalidateQueries({ queryKey: ["heatmap"] });
    },
  });
}

export function useUpdateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status?: "aberta" | "em_andamento" | "resolvida";
      action_taken?: string;
    }) => {
      const patch: Record<string, unknown> = {};
      if (input.status !== undefined) patch.status = input.status;
      if (input.action_taken !== undefined) patch.action_taken = input.action_taken;
      const { error } = await (supabase as any)
        .from("customer_complaints")
        .update(patch)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer_complaints"] });
      qc.invalidateQueries({ queryKey: ["complaint_trends"] });
      qc.invalidateQueries({ queryKey: ["heatmap"] });
    },
  });
}
