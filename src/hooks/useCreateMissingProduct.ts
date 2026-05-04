import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type CreateMissingProductInput = {
  unit_id: string;
  product_name: string;
  brand?: string | null;
  category?: string | null;
  notes?: string | null;
};

export function useCreateMissingProduct() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMissingProductInput) => {
      if (!user?.id) throw new Error("Não autenticado");
      const { data: prof } = await (supabase as any)
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!prof?.id) throw new Error("Perfil não encontrado");

      const { data, error } = await (supabase as any)
        .from("missing_product_requests")
        .insert({
          registered_by_user_id: prof.id,
          unit_id: input.unit_id,
          product_name: input.product_name.trim(),
          brand: input.brand?.trim() || null,
          category: input.category?.trim() || null,
          notes: input.notes?.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missing_products"] });
      qc.invalidateQueries({ queryKey: ["missing_products_my_votes"] });
    },
  });
}
