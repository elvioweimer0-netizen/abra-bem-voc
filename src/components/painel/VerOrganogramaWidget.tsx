import { Link } from "react-router-dom";
import { Building, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUnitOrgData } from "@/hooks/useUnitOrgData";

export function VerOrganogramaWidget() {
  const { profile } = useAuth();
  const unitId = (profile as any)?.unit_id as string | undefined;
  const { data } = useUnitOrgData(unitId);

  if (!unitId) return null;

  const total = data ? (data.collaborators?.length ?? 0) + (data.supervisors?.length ?? 0) + (data.manager ? 1 : 0) : null;

  return (
    <Card className="p-4 flex items-center justify-between gap-3 bg-gradient-to-r from-primary/10 to-transparent border-primary/30">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Building className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">Veja sua equipe no organograma</p>
          <p className="text-xs text-muted-foreground truncate">
            {total != null ? `${total} pessoas na sua unidade` : "Carregando…"}
          </p>
        </div>
      </div>
      <Button asChild size="sm">
        <Link to={`/unidade/${unitId}`}>
          Abrir <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </Button>
    </Card>
  );
}
