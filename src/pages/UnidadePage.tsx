import { useParams, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUnitOrgData } from "@/hooks/useUnitOrgData";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { FullOrganogramaTree } from "@/components/organograma/FullOrganogramaTree";
import { CidadeAltaOrgTree } from "@/components/organograma/CidadeAltaOrgTree";
import { UnitKPIs } from "@/components/organograma/UnitKPIs";
import { useRole } from "@/hooks/useRole";

function isCidadeAlta(u: { code?: string | null; name?: string | null; type?: string | null } | null | undefined) {
  if (!u) return false;
  const code = (u.code ?? "").toUpperCase();
  const name = (u.name ?? "").toLowerCase();
  return u.type === "loja" && (code === "MATRIZ" || code === "L01" || name.includes("cidade alta"));
}

export default function UnidadePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useUnitOrgData(id);
  const { data: accessible } = useAccessibleUnits();
  const { isAdmin, isSupervisor } = useRole();

  if (!id) return <Navigate to="/unidades" replace />;

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

      {/* Organograma — full width */}
      {isLoading || !data ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      ) : (
        <FullOrganogramaTree data={data} />
      )}

      {/* KPIs — full width abaixo */}
      {data && <UnitKPIs data={data} layout="grid" />}
    </div>
  );
}
