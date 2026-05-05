import { TabHub } from "@/components/nav/TabHub";
import { useRole } from "@/hooks/useRole";

export default function CulturaHub() {
  const { isAdmin } = useRole();
  return (
    <TabHub
      title="Cultura"
      description="Identidade, treinamento e reconhecimento."
      breadcrumb="Cultura"
      tabs={[
        { value: "caderno", label: "Caderno do Gerente", load: () => import("@/pages/Caderno") },
        { value: "onboarding", label: "Onboarding", load: () => import("@/pages/Onboarding") },
        { value: "conquistas", label: "Conquistas", load: () => import("@/pages/MinhasConquistas") },
        { value: "documentos", label: "Documentos", load: () => import("@/pages/DocumentosLideranca") },
        { value: "tv", label: "TV de Refeitório", show: isAdmin, load: () => import("@/pages/AdminTvDisplays") },
      ]}
    />
  );
}
