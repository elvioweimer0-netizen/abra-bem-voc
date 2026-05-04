import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUpvoteMissingProduct() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, voted }: { requestId: string; voted: boolean }) => {
      if (!user?.id) throw new Error("Não autenticado");
      const { data: prof } = await (supabase as any)
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!prof?.id) throw new Error("Perfil não encontrado");

      if (voted) {
        const { error } = await (supabase as any)
          .from("missing_product_upvotes")
          .delete()
          .eq("request_id", requestId)
          .eq("user_id", prof.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("missing_product_upvotes")
          .insert({ request_id: requestId, user_id: prof.id });
        if (error && !String(error.message || "").includes("duplicate")) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missing_products"] });
      qc.invalidateQueries({ queryKey: ["missing_products_my_votes"] });
      qc.invalidateQueries({ queryKey: ["missing_products_search"] });
    },
  });
}

export function useUpdateMissingProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "aberto" | "em_compras" | "adicionado" | "recusado" }) => {
      const { error } = await (supabase as any)
        .from("missing_product_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missing_products"] });
    },
  });
}
