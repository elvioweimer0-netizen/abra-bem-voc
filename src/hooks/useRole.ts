import { useAuth } from "@/contexts/AuthContext";

type CargoTipo = "admin" | "gerente" | "lider" | "colaborador";

// Mapping user roles to permission levels:
// master = admin | adm_departamento = admin | supervisor = lider | gerente = gerente | colaborador = colaborador
const GESTAO_ROLES: CargoTipo[] = ["admin", "gerente", "lider"];

export function useRole() {
  const { profile } = useAuth();
  const cargo = (profile?.cargo ?? "colaborador") as CargoTipo;

  return {
    cargo,
    isAdmin: cargo === "admin",
    isGerente: cargo === "gerente",
    isLider: cargo === "lider",
    isColaborador: cargo === "colaborador",
    isGestao: GESTAO_ROLES.includes(cargo),
  };
}
