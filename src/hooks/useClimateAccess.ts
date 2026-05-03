import { useRole } from "@/hooks/useRole";

export function useClimateAccess() {
  const { isAdmin, isSupervisor, isGerenteAdm, isGerenteLoja, isMaster } = useRole();
  const canViewClima = isAdmin || isSupervisor || isGerenteAdm || isGerenteLoja || isMaster;
  const canManageClima = isAdmin; // master/admin (isAdmin já cobre ambos no useRole)
  return { canViewClima, canManageClima };
}
