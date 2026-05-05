import { TabHub } from "@/components/nav/TabHub";
import { useRole } from "@/hooks/useRole";

export default function MinhaEquipeHub() {
  const { cargo, isAdmin, isSupervisor } = useRole();
  const isGerenteLojaPlus = ["gerente_loja", "gerente", "supervisor", "admin", "master"].includes(cargo);
  const churnAllowed = ["master", "admin", "supervisor", "gerente_loja"].includes(cargo);

  return (
    <TabHub
      title="Minha Equipe"
      description="Acompanhe seu time."
      breadcrumb="Minha Equipe"
      tabs={[
        { value: "equipe", label: "Quem tá hoje", load: () => import("@/pages/MinhaEquipe") },
        { value: "pdi", label: "PDI", load: () => import("@/pages/PdiEquipe") },
        { value: "reconhecimento", label: "Reconhecimento", load: () => import("@/pages/Reconhecimentos") },
        { value: "curio-ouro", label: "Curió de Ouro", load: () => import("@/pages/CurioDeOuroPage") },
        { value: "score", label: "Score do Encarregado", load: () => import("@/pages/ScoresRanking"), show: isAdmin || isSupervisor },
        { value: "mentoria", label: "Mentoria", load: () => import("@/pages/MentoriaPage") },
        { value: "churn", label: "Risco de Churn", show: churnAllowed, load: () => import("@/pages/AdminRiscoChurn") },
        { value: "bem-estar", label: "Bem-estar", show: isGerenteLojaPlus, load: () => import("@/pages/AdminBemEstarPage") },
      ]}
    />
  );
}
