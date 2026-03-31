import type { Tables, Enums } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Colaborador = Tables<"colaboradores">;
export type Advertencia = Tables<"advertencias">;
export type Suspensao = Tables<"suspensoes">;
export type Ocorrencia = Tables<"ocorrencias">;
export type Noticia = Tables<"noticias">;
export type UserRole = Tables<"user_roles">;

// These types come from new tables - define manually until types regenerate
export type Endomarketing = {
  id: string;
  tipo: "aniversario" | "destaque" | "campanha" | "mensagem";
  titulo: string;
  descricao: string | null;
  unidade: Enums<"unidade_tipo"> | null;
  data: string;
  created_at: string;
};

export type Aviso = {
  id: string;
  titulo: string;
  conteudo: string;
  urgente: boolean;
  unidade: Enums<"unidade_tipo"> | null;
  ativo: boolean;
  created_at: string;
};

export type CargoTipo = Enums<"cargo_tipo">;
export type UnidadeTipo = Enums<"unidade_tipo">;
export type SetorTipo = Enums<"setor_tipo">;

export const setorLabels: Record<string, string> = {
  acougue: "Açougue",
  padaria: "Padaria",
  hortifruti: "Hortifruti",
  mercearia: "Mercearia",
  frente_de_caixa: "Frente de Caixa",
  deposito: "Depósito",
};

export const endomarketingTipoLabels: Record<string, string> = {
  aniversario: "Aniversário",
  destaque: "Destaque",
  campanha: "Campanha",
  mensagem: "Mensagem",
};

export const statusLabels: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  ferias: "Férias",
  afastado: "Afastado",
};
