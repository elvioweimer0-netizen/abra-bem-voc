import { useAuth } from "@/contexts/AuthContext";
import { useViewAs } from "@/contexts/ViewAsContext";

export type CargoTipo =
  | "master"
  | "admin"
  | "supervisor"
  | "gerente"
  | "gerente_loja"
  | "gerente_adm"
  | "encarregado"
  | "fiscal"
  | "lider_setor"
  | "colaborador";

/** Perfis que podem ver áreas de gestão */
const GESTAO_ROLES: CargoTipo[] = [
  "master", "admin", "gerente", "gerente_adm", "gerente_loja",
];

/** Perfis com poderes administrativos globais */
const ADMIN_ROLES: CargoTipo[] = ["master", "admin"];

/** Perfis que podem gerenciar usuários */
const USER_MGMT_ROLES: CargoTipo[] = ["master", "admin", "gerente_adm", "supervisor"];

export function useRole() {
  const { profile } = useAuth();
  const { role } = useViewAs();

  const realCargo = (profile?.cargo ?? "colaborador") as CargoTipo;
  const cargo = (ADMIN_ROLES.includes(realCargo) ? role : realCargo) as CargoTipo;
  const appProfile = ADMIN_ROLES.includes(cargo)
    ? "admin"
    : cargo === "supervisor"
      ? "supervisor"
    : ["gerente", "gerente_loja", "gerente_adm"].includes(cargo)
      ? "gerente"
      : ["encarregado", "lider_setor", "fiscal"].includes(cargo)
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
    isGerenteAdm: cargo === "gerente_adm",
    isGerenteLoja: cargo === "gerente_loja" || cargo === "gerente",
    isLiderSetor: cargo === "lider_setor",
    isFiscal: cargo === "fiscal",
    isColaborador: appProfile === "colaborador",
    isEncarregado: appProfile === "encarregado",
    isGerente: appProfile === "gerente",
    isLeadershipPanel: appProfile === "supervisor" || appProfile === "admin",

    // Flags compostas
    isGestao: GESTAO_ROLES.includes(cargo),
    canManageUsers: USER_MGMT_ROLES.includes(cargo),

    /** Pode editar conteúdo global (não restrito à unidade) */
    canEditGlobal: ADMIN_ROLES.includes(cargo) || cargo === "supervisor",

    /** Pode visualizar tudo mas só edita sua área */
    canViewAll: ADMIN_ROLES.includes(cargo) || cargo === "supervisor" || cargo === "gerente_adm",
  };
}
