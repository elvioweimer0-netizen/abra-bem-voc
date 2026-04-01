import { useAuth } from "@/contexts/AuthContext";
import { useViewAs } from "@/contexts/ViewAsContext";

export type CargoTipo =
  | "master"
  | "admin"
  | "adm_departamento"
  | "supervisor"
  | "gerente"
  | "gerente_adm"
  | "gerente_loja"
  | "lider"
  | "colaborador";

/** Perfis que podem ver áreas de gestão */
const GESTAO_ROLES: CargoTipo[] = [
  "master", "admin", "adm_departamento", "supervisor",
  "gerente", "gerente_adm", "gerente_loja", "lider",
];

/** Perfis com poderes administrativos globais */
const ADMIN_ROLES: CargoTipo[] = ["master", "admin"];

/** Perfis que podem gerenciar usuários */
const USER_MGMT_ROLES: CargoTipo[] = ["master", "admin", "adm_departamento", "supervisor"];

export function useRole() {
  const { profile } = useAuth();
  const { role } = useViewAs();

  const realCargo = (profile?.cargo ?? "colaborador") as CargoTipo;
  const cargo = role as CargoTipo;

  return {
    cargo,
    realCargo,

    // Flags básicas
    isMaster: cargo === "master",
    isAdmin: ADMIN_ROLES.includes(cargo),
    isRealAdmin: ADMIN_ROLES.includes(realCargo),
    isSupervisor: cargo === "supervisor",
    isGerenteAdm: cargo === "gerente_adm" || cargo === "adm_departamento",
    isGerenteLoja: cargo === "gerente_loja" || cargo === "gerente",
    isLider: cargo === "lider",
    isColaborador: cargo === "colaborador",

    // Flags compostas
    isGestao: GESTAO_ROLES.includes(cargo),
    canManageUsers: USER_MGMT_ROLES.includes(cargo),

    /** Pode editar conteúdo global (não restrito à unidade) */
    canEditGlobal: ADMIN_ROLES.includes(cargo) || cargo === "supervisor",

    /** Pode visualizar tudo mas só edita sua área */
    canViewAll: ADMIN_ROLES.includes(cargo) || cargo === "supervisor" ||
      cargo === "gerente_adm" || cargo === "adm_departamento",
  };
}
