import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";

export type UserPersona =
  | "gerente_novo"
  | "gerente_experiente"
  | "encarregado_novato"
  | "encarregado_experiente"
  | "outro";

function daysSince(date?: string | null): number {
  if (!date) return 9999;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

export function useUserPersona(): UserPersona {
  const { profile } = useAuth();
  const { isGerente, isEncarregado, cargo } = useRole();
  const adm = (profile as any)?.data_admissao || (profile as any)?.created_at;
  const days = daysSince(adm);
  if (isGerente || cargo === "gerente_loja") return days < 60 ? "gerente_novo" : "gerente_experiente";
  if (isEncarregado) return days < 30 ? "encarregado_novato" : "encarregado_experiente";
  return "outro";
}
