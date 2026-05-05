import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type AlocacaoPosicao =
  | "gerente_unidade"
  | "encarregado_loja"
  | "encarregado_setor"
  | "colaborador";

export type AlocacaoSetor =
  | "GERENTE"
  | "ENCARREGADO_LOJA"
  | "FLV"
  | "PADARIA"
  | "ACOUGUE"
  | "MERCEARIA"
  | "FRENTE_CAIXA"
  | "RECEBIMENTO"
  | "LIMPEZA"
  | "VIGIA";

export type OrgAlocacao = {
  id: string;
  profile_id: string;
  unit_id: string;
  posicao: AlocacaoPosicao;
  setor: AlocacaoSetor | null;
  sub_setor: string | null;
  ordem: number;
  alocado_por: string | null;
  alocado_em: string;
};

export const SETOR_LABELS: Record<AlocacaoSetor, string> = {
  GERENTE: "Gerente",
  ENCARREGADO_LOJA: "Encarregado de Loja",
  FLV: "FLV",
  PADARIA: "Padaria",
  ACOUGUE: "Açougue",
  MERCEARIA: "Mercearia",
  FRENTE_CAIXA: "Frente de Caixa",
  RECEBIMENTO: "Recebimento + Faturamento",
  LIMPEZA: "Limpeza / Manutenção",
  VIGIA: "Guarda / Vigia",
};

export const POSICAO_LABELS: Record<AlocacaoPosicao, string> = {
  gerente_unidade: "Gerente da Unidade",
  encarregado_loja: "Encarregado de Loja",
  encarregado_setor: "Encarregado de Setor",
  colaborador: "Colaborador",
};

export const SETORES_ORDER: AlocacaoSetor[] = [
  "FLV", "PADARIA", "FRENTE_CAIXA", "ACOUGUE", "MERCEARIA",
  "RECEBIMENTO", "LIMPEZA", "VIGIA",
];

export function useOrgAlocacoes(unitId: string | undefined) {
  return useQuery({
    queryKey: ["org_alocacoes", unitId],
    enabled: !!unitId,
    queryFn: async (): Promise<OrgAlocacao[]> => {
      const { data, error } = await (supabase as any)
        .from("org_alocacoes")
        .select("*")
        .eq("unit_id", unitId);
      if (error) throw error;
      return (data ?? []) as OrgAlocacao[];
    },
  });
}

export function useAllocateMutation(unitId: string | undefined) {
  const qc = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      profile_id: string;
      posicao: AlocacaoPosicao;
      setor: AlocacaoSetor | null;
      sub_setor?: string | null;
      ordem?: number;
    }) => {
      if (!unitId) throw new Error("unit_id ausente");
      const payload = {
        profile_id: input.profile_id,
        unit_id: unitId,
        posicao: input.posicao,
        setor: input.setor,
        sub_setor: input.sub_setor ?? null,
        ordem: input.ordem ?? 0,
        alocado_por: profile?.id ?? null,
        alocado_em: new Date().toISOString(),
      };
      const { error } = await (supabase as any)
        .from("org_alocacoes")
        .upsert(payload, { onConflict: "profile_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org_alocacoes", unitId] });
      toast({ title: "Alocação salva" });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao alocar", description: String(e?.message ?? e), variant: "destructive" });
    },
  });
}

export function useRemoveAlocacaoMutation(unitId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile_id: string) => {
      const { error } = await (supabase as any)
        .from("org_alocacoes")
        .delete()
        .eq("profile_id", profile_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org_alocacoes", unitId] });
      toast({ title: "Removido do organograma" });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao remover", description: String(e?.message ?? e), variant: "destructive" });
    },
  });
}
