import { useAuth } from "@/contexts/AuthContext";
import { useViewAs } from "@/contexts/ViewAsContext";

export type CargoTipo =
  | "master"
  | "admin"
  | "encarregado"
  | "adm_departamento"
  | "supervisor"
  | "gerente"
  | "gerente_adm"
  | "gerente_loja"
  | "lider"
  | "colaborador";

/** Perfis que podem ver áreas de gestão */
const GESTAO_ROLES: CargoTipo[] = [
  "master", "admin", "gerente", "gerente_adm", "gerente_loja",
];

/** Perfis com poderes administrativos globais */
const ADMIN_ROLES: CargoTipo[] = ["master", "admin"];

/** Perfis que podem gerenciar usuários */
const USER_MGMT_ROLES: CargoTipo[] = ["master", "admin", "adm_departamento", "supervisor"];

export function useRole() {
  const { profile } = useAuth();
  const { role } = useViewAs();

  const realCargo = (profile?.cargo ?? "colaborador") as CargoTipo;
  const cargo = (ADMIN_ROLES.includes(realCargo) ? role : realCargo) as CargoTipo;
  const appProfile = ADMIN_ROLES.includes(cargo)
    ? "admin"
    : ["gerente", "gerente_loja", "gerente_adm"].includes(cargo)
      ? "gerente"
      : ["encarregado", "lider", "supervisor", "adm_departamento"].includes(cargo)
        ? "encarregado"
        : "colaborador";

  return {
    cargo,
    realCargo,
    appProfile,

    // Flags básicas
    isMaster: cargo === "master",
    isAdmin: ADMIN_ROLES.includes(cargo),
    isRealAdmin: ADMIN_ROLES.includes(realCargo),
    isSupervisor: cargo === "supervisor",
    isGerenteAdm: cargo === "gerente_adm" || cargo === "adm_departamento",
    isGerenteLoja: cargo === "gerente_loja" || cargo === "gerente",
    isLider: cargo === "lider",
    isColaborador: appProfile === "colaborador",
    isEncarregado: appProfile === "encarregado",
    isGerente: appProfile === "gerente",

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
