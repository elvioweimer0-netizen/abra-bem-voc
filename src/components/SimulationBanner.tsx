import { Eye, X } from "lucide-react";
import { useViewAs } from "@/contexts/ViewAsContext";
import { useRole } from "@/hooks/useRole";

const cargoLabels: Record<string, string> = {
  master: "Master",
  admin: "Admin",
  supervisor: "Supervisor",
  gerente: "Gerente",
  gerente_loja: "Gerente de Loja",
  gerente_adm: "Gerente Adm.",
  encarregado: "Encarregado",
  fiscal: "Fiscal",
  lider_setor: "Líder de Setor",
  colaborador: "Colaborador",
};

export function SimulationBanner() {
  const { isSimulating, role, clearSimulation } = useViewAs();
  const { isRealAdmin } = useRole();

  if (!isSimulating || !isRealAdmin || !role) return null;

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-md">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span>
          Visualizando como <strong>{cargoLabels[role] ?? role}</strong>. Clique para voltar.
        </span>
      </div>
      <button
        onClick={clearSimulation}
        className="flex items-center gap-1 rounded-md bg-white/20 px-3 py-1 text-xs font-semibold transition-colors hover:bg-white/30"
        aria-label="Sair da simulação"
      >
        <X className="h-3.5 w-3.5" /> Voltar ao meu perfil
      </button>
    </div>
  );
}
