import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type OrgSolicitacao = {
  id: string;
  unit_id: string;
  profile_id: string | null;
  tipo_solicitacao: "aumentar_quadro" | "contratacao_emergencial" | "remanejamento_excedente";
  setor_alvo: string | null;
  posicao_alvo: string | null;
  aumento_pretendido: number;
  justificativa_texto: string;
  numeros_jsonb: Record<string, any> | null;
  status: "pendente" | "aprovada" | "recusada" | "cancelada";
  solicitado_por: string | null;
  solicitado_em: string;
  decidido_por: string | null;
  decidido_em: string | null;
  motivo_decisao: string | null;
};

export function useOrgSolicitacoes(opts: { unitId?: string; status?: OrgSolicitacao["status"] | "todas" } = {}) {
  return useQuery({
    queryKey: ["org_solicitacoes", opts.unitId ?? "all", opts.status ?? "todas"],
    queryFn: async (): Promise<OrgSolicitacao[]> => {
      let q = (supabase as any).from("org_solicitacoes").select("*").order("solicitado_em", { ascending: false });
      if (opts.unitId) q = q.eq("unit_id", opts.unitId);
      if (opts.status && opts.status !== "todas") q = q.eq("status", opts.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as OrgSolicitacao[];
    },
  });
}

export function useCreateOrgSolicitacao() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      unit_id: string;
      profile_id: string | null;
      setor_alvo?: string | null;
      posicao_alvo?: string | null;
      aumento_pretendido?: number;
      tipo_solicitacao?: OrgSolicitacao["tipo_solicitacao"];
      justificativa_texto: string;
      numeros_jsonb?: Record<string, any>;
    }) => {
      const payload = {
        unit_id: input.unit_id,
        profile_id: input.profile_id,
        setor_alvo: input.setor_alvo ?? null,
        posicao_alvo: input.posicao_alvo ?? null,
        aumento_pretendido: input.aumento_pretendido ?? 1,
        tipo_solicitacao: input.tipo_solicitacao ?? "aumentar_quadro",
        justificativa_texto: input.justificativa_texto,
        numeros_jsonb: input.numeros_jsonb ?? {},
        solicitado_por: profile?.id ?? null,
      };
      const { error } = await (supabase as any).from("org_solicitacoes").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org_solicitacoes"] });
      toast({ title: "Solicitação enviada", description: "Você será notificado quando o master decidir." });
    },
    onError: (e: any) => toast({ title: "Erro", description: String(e?.message ?? e), variant: "destructive" }),
  });
}

export function useDecideOrgSolicitacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; decision: "aprovar" | "recusar"; motivo?: string }) => {
      const fn = input.decision === "aprovar" ? "aprovar_org_solicitacao" : "recusar_org_solicitacao";
      const { error } = await (supabase as any).rpc(fn, { _id: input.id, _motivo: input.motivo ?? null });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["org_solicitacoes"] });
      qc.invalidateQueries({ queryKey: ["org_alocacoes"] });
      qc.invalidateQueries({ queryKey: ["unit-total-desejado"] });
      toast({ title: vars.decision === "aprovar" ? "Aprovada" : "Recusada" });
    },
    onError: (e: any) => toast({ title: "Erro", description: String(e?.message ?? e), variant: "destructive" }),
  });
}

export function isExceedsDesiredError(e: any): boolean {
  const msg = String(e?.message ?? e ?? "");
  return msg.includes("EXCEEDS_DESIRED");
}
