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

/** Cargos que veem o painel operacional (líderes) */
export const LEADER_ROLES: CargoTipo[] = [
  "master", "admin", "supervisor", "gerente", "gerente_loja", "gerente_adm", "encarregado", "fiscal",
];

/** Cargos que veem o feed simplificado */
export const FEED_ROLES: CargoTipo[] = ["lider_setor", "colaborador"];

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
  // Apenas master/admin reais podem simular outros cargos
  const cargo = (ADMIN_ROLES.includes(realCargo) && role ? role : realCargo) as CargoTipo;

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

    // Novas flags estruturais
    isLider: LEADER_ROLES.includes(cargo),
    isFeedUser: FEED_ROLES.includes(cargo),

    // Flags compostas
    isGestao: GESTAO_ROLES.includes(cargo),
    canManageUsers: USER_MGMT_ROLES.includes(cargo),

    canEditGlobal: ADMIN_ROLES.includes(cargo) || cargo === "supervisor",
    canViewAll: ADMIN_ROLES.includes(cargo) || cargo === "supervisor" || cargo === "gerente_adm",
  };
}
