import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";

export function useCanEditCulture() {
  const { profile } = useAuth();
  const { isAdmin, cargo } = useRole();
  if (isAdmin) return true;
  if (cargo !== "gerente_adm") return false;
  const text = `${(profile as any)?.cargo_titulo ?? ""} ${(profile as any)?.descricao ?? ""} ${profile?.nome ?? ""}`.toLowerCase();
  return /(recursos humanos|departamento pessoal|\brh\b|\bdp\b|marketing)/.test(text);
}
