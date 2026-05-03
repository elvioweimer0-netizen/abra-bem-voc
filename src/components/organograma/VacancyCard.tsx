import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRole";

export function VacancyCard({
  label,
  cargo,
  setor,
  gerencia,
  unitId,
  compact = false,
}: {
  label: string;
  cargo: string;
  setor?: string;
  gerencia?: string;
  unitId: string;
  compact?: boolean;
}) {
  const { isAdmin, isGerenteLoja } = useRole();
  const navigate = useNavigate();
  const canAdd = isAdmin || isGerenteLoja;

  const handleAdd = () => {
    const params = new URLSearchParams({ cargo, unit_id: unitId });
    if (setor) params.set("setor", setor);
    if (gerencia) params.set("gerencia", gerencia);
    navigate(`/gestao-usuarios?${params.toString()}`);
  };

  return (
    <div className={`inline-flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-3 ${compact ? "min-w-[140px]" : "min-w-[170px]"}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Plus className="h-5 w-5" />
      </div>
      <p className="text-center text-xs font-medium text-muted-foreground">Vaga aberta</p>
      <p className="text-center text-xs">{label}</p>
      {canAdd && (
        <Button variant="outline" size="sm" onClick={handleAdd} className="h-7 text-[11px]">
          + Adicionar pessoa
        </Button>
      )}
    </div>
  );
}
