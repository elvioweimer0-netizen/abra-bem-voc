import { useAuth } from "@/contexts/AuthContext";

type CargoTipo = "master" | "admin" | "adm_departamento" | "supervisor" | "gerente" | "lider" | "colaborador";

const GESTAO_ROLES: CargoTipo[] = ["master", "admin", "adm_departamento", "supervisor", "gerente", "lider"];
const ADMIN_ROLES: CargoTipo[] = ["master", "admin"];
const USER_MGMT_ROLES: CargoTipo[] = ["master", "admin", "adm_departamento", "supervisor"];

export function useRole() {
  const { profile } = useAuth();
  const cargo = (profile?.cargo ?? "colaborador") as CargoTipo;

  return {
    cargo,
    isMaster: cargo === "master",
    isAdmin: ADMIN_ROLES.includes(cargo),
    isAdmDepartamento: cargo === "adm_departamento",
    isSupervisor: cargo === "supervisor",
    isGerente: cargo === "gerente",
    isLider: cargo === "lider",
    isColaborador: cargo === "colaborador",
    isGestao: GESTAO_ROLES.includes(cargo),
    canManageUsers: USER_MGMT_ROLES.includes(cargo),
  };
}
