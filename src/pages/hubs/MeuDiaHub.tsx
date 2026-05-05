import { TabHub } from "@/components/nav/TabHub";
import { useRole } from "@/hooks/useRole";

export default function MeuDiaHub() {
  const { isLider } = useRole();
  return (
    <TabHub
      title="Meu Dia"
      description="Tudo o que você precisa pra tocar o dia."
      breadcrumb="Meu Dia"
      tabs={[
        { value: "checklist", label: "Checklist do Dia", load: () => import("@/pages/ChecklistDiario") },
        { value: "compromissos", label: "Compromissos", show: isLider, load: () => import("@/pages/Compromissos") },
        { value: "huddle", label: "Daily Huddle", show: isLider, load: () => import("@/pages/DailyHuddle") },
        { value: "pergunta", label: "Pergunta da Semana", load: () => import("@/pages/PerguntaSemana") },
        { value: "whatsapp", label: "Resumo WhatsApp", load: () => import("@/pages/WhatsappResumo") },
      ]}
    />
  );
}
