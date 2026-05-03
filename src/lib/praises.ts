import type { Enums } from "@/integrations/supabase/types";

export type PraiseType = "liderado" | "peer" | "equipe_externa";

export const PRAISE_TYPE_LABEL: Record<PraiseType, string> = {
  liderado: "Liderado",
  peer: "Peer",
  equipe_externa: "Equipe Externa",
};

export const PRAISE_TYPE_BADGE_CLASS: Record<PraiseType, string> = {
  liderado: "border-primary/20 bg-primary/10 text-primary",
  peer: "border-[hsl(var(--gold)/0.4)] bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))]",
  equipe_externa: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

export const PRAISE_TYPE_ICON: Record<PraiseType, string> = {
  liderado: "👑",
  peer: "🤝",
  equipe_externa: "🌐",
};

type Cargo = Enums<"cargo_tipo">;

/** Tipos de praise disponíveis para o autor por cargo */
export function availablePraiseTypes(cargo: Cargo | string | undefined | null): PraiseType[] {
  if (!cargo) return ["liderado"];
  const c = String(cargo);
  if (["admin", "master", "supervisor"].includes(c)) return ["liderado", "peer", "equipe_externa"];
  if (["gerente", "gerente_loja", "gerente_adm"].includes(c)) return ["liderado", "peer", "equipe_externa"];
  if (["encarregado", "lider_setor"].includes(c)) return ["liderado", "peer"];
  return ["liderado"];
}
