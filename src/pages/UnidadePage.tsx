import { useParams, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUnitOrgData } from "@/hooks/useUnitOrgData";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { OrganogramaTree } from "@/components/organograma/OrganogramaTree";
import { UnitKPIs } from "@/components/organograma/UnitKPIs";
import { useRole } from "@/hooks/useRole";

export default function UnidadePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useUnitOrgData(id);
  const { data: accessible } = useAccessibleUnits();
  const { isAdmin, isSupervisor } = useRole();

  if (!id) return <Navigate to="/unidades" replace />;

  // Guard: se não é admin/supervisor e a unidade não está nas acessíveis → bloquear
  if (accessible && !isAdmin && !isSupervisor) {
    const allowed = accessible.some((u) => u.id === id);
    if (!allowed) return <Navigate to="/unidades" replace />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
            <Link to="/unidades"><ArrowLeft className="h-4 w-4 mr-1" />Unidades</Link>
          </Button>
          <h1 className="text-2xl font-bold">{data?.unit?.name ?? "Unidade"}</h1>
          <p className="text-sm text-muted-foreground">Organograma e indicadores da unidade</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 order-2 md:order-1">
          <div className="rounded-xl border bg-card p-4 overflow-x-auto" style={{ touchAction: "pinch-zoom" }}>
            {isLoading || !data ? (
              <div className="h-64 animate-pulse rounded-lg bg-muted" />
            ) : (
              <div className="min-w-[800px]">
                <OrganogramaTree data={data} />
              </div>
            )}
          </div>
        </div>
        <div className="order-1 md:order-2">
          {data && <UnitKPIs data={data} />}
        </div>
      </div>
    </div>
  );
}
