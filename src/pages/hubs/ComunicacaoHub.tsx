import { TabHub } from "@/components/nav/TabHub";

export default function ComunicacaoHub() {
  return (
    <TabHub
      title="Comunicação"
      description="Avisos, notícias, chat e cultura num só lugar."
      breadcrumb="Comunicação"
      tabs={[
        { value: "avisos", label: "Avisos", load: () => import("@/pages/Avisos") },
        { value: "noticias", label: "Notícias", load: () => import("@/pages/Noticias") },
        { value: "chat", label: "Chat", load: () => import("@/pages/Chat") },
        { value: "stories", label: "Stories", load: () => import("@/pages/MeusStories") },
        { value: "curiozinho", label: "Carta do Curiózinho", load: () => import("@/pages/CuriozinhoHistorico") },
        { value: "cultura", label: "Pílulas de Cultura", load: () => import("@/pages/Cultura") },
        { value: "historias", label: "Histórias", load: () => import("@/pages/Historias") },
      ]}
    />
  );
}
