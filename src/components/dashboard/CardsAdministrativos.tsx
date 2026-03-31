import { StatCard } from "@/components/StatCard";
import { Users, AlertTriangle, Ban, Wrench } from "lucide-react";

interface CardsAdministrativosProps {
  counts: {
    colaboradores: number;
    advertencias: number;
    suspensoes: number;
    ocorrencias: number;
  };
}

export function CardsAdministrativos({ counts }: CardsAdministrativosProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Colaboradores" value={counts.colaboradores} icon={Users} color="primary" />
      <StatCard title="Advertências" value={counts.advertencias} icon={AlertTriangle} color="warning" />
      <StatCard title="Suspensões" value={counts.suspensoes} icon={Ban} color="destructive" />
      <StatCard title="Ocorrências" value={counts.ocorrencias} icon={Wrench} color="success" />
    </div>
  );
}
