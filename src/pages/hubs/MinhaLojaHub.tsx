import { TabHub } from "@/components/nav/TabHub";
import { useRole } from "@/hooks/useRole";
import { Navigate } from "react-router-dom";

export default function MinhaLojaHub() {
  const { cargo } = useRole();
  const allowed = ["gerente_loja", "gerente", "encarregado", "supervisor", "admin", "master"].includes(cargo);
  if (!allowed) return <Navigate to="/" replace />;

  const heatmapAllowed = ["master", "admin", "supervisor", "gerente_adm"].includes(cargo);
  const auditAllowed = ["master", "admin", "supervisor", "gerente_adm"].includes(cargo);
  const vendasAllowed = ["gerente_loja", "gerente", "supervisor", "admin", "master"].includes(cargo);

  return (
    <TabHub
      title="Minha Loja"
      description="Indicadores e operação da sua unidade."
      breadcrumb="Minha Loja"
      tabs={[
        { value: "vendas", label: "Vendas / Meta", show: vendasAllowed, load: () => import("@/pages/VendasPage") },
        { value: "heatmap", label: "Heatmap", show: heatmapAllowed, load: () => import("@/pages/Heatmap") },
        { value: "auditoria", label: "Auditoria Visual", show: auditAllowed, load: () => import("@/pages/AuditoriaVisual") },
        { value: "mistery", label: "Cliente Misterioso", load: () => import("@/pages/MysteryHistoricoPage") },
      ]}
    />
  );
}
