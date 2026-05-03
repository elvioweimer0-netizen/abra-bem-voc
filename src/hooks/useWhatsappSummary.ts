import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type WhatsappSummaryItem = { timestamp: string; autor: string; texto: string };
export type WhatsappSummaryPayload = {
  acoes: WhatsappSummaryItem[];
  decisoes: WhatsappSummaryItem[];
  reclamacoes: WhatsappSummaryItem[];
  menos_relevantes: WhatsappSummaryItem[];
};
export type WhatsappSummary = {
  id: string;
  user_id: string;
  unit_id: string | null;
  raw_input: string;
  summary: WhatsappSummaryPayload | null;
  created_at: string;
};

export function useWhatsappSummaries() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["whatsapp_summaries", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("whatsapp_summaries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WhatsappSummary[];
    },
  });
}

export function useProcessWhatsappSummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (raw_input: string) => {
      const { data, error } = await supabase.functions.invoke("process-whatsapp-summary", {
        body: { raw_input },
      });
      if (error) {
        const ctx = (error as any)?.context;
        let msg = error.message || "Falha ao processar";
        try {
          const body = ctx && (await ctx.json?.());
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }
      return data as { id: string; summary: WhatsappSummaryPayload; created_at: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whatsapp_summaries"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
}

export function useDeleteWhatsappSummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("whatsapp_summaries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whatsapp_summaries"] });
      toast.success("Resumo apagado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
