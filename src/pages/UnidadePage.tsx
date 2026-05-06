import { useParams, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUnitOrgData } from "@/hooks/useUnitOrgData";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { FullOrganogramaTree } from "@/components/organograma/FullOrganogramaTree";
import { CidadeAltaOrgManual } from "@/components/organograma/CidadeAltaOrgManual";
import { FuncionariosTable } from "@/components/organograma/FuncionariosTable";
import { UnitKPIs } from "@/components/organograma/UnitKPIs";
import { useRole } from "@/hooks/useRole";
import { useOrgAlocacoes } from "@/hooks/useOrgAlocacoes";

function isLoja(u: { code?: string | null; name?: string | null; type?: string | null } | null | undefined) {
  if (!u) return false;
  return (u.type ?? "").toLowerCase() === "loja";
}

export default function UnidadePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useUnitOrgData(id);
  const { data: accessible } = useAccessibleUnits();
  const { isAdmin, isSupervisor } = useRole();
  const { data: alocacoes = [] } = useOrgAlocacoes(id);

  if (!id) return <Navigate to="/unidades" replace />;

  if (accessible && !isAdmin && !isSupervisor) {
    const allowed = accessible.some((u) => u.id === id);
    if (!allowed) return <Navigate to="/unidades" replace />;
  }

  const isCA = isCidadeAlta(data?.unit);

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

      {isLoading || !data ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      ) : isCA ? (
        <>
          <UnitKPIs data={data} layout="grid" />
          <Tabs defaultValue="organograma">
            <TabsList>
              <TabsTrigger value="organograma">Organograma</TabsTrigger>
              <TabsTrigger value="funcionarios">Funcionários ({(data.people ?? []).length})</TabsTrigger>
              <TabsTrigger value="sem_alocacao">
                Sem Alocação ({(data.people ?? []).filter((p) => !alocacoes.some((a) => a.profile_id === p.id)).length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="organograma" className="mt-3">
              <CidadeAltaOrgManual data={data} />
            </TabsContent>
            <TabsContent value="funcionarios" className="mt-3">
              <FuncionariosTable unitId={id} people={data.people ?? []} alocacoes={alocacoes} />
            </TabsContent>
            <TabsContent value="sem_alocacao" className="mt-3">
              <FuncionariosTable unitId={id} people={data.people ?? []} alocacoes={alocacoes} onlyUnallocated />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <FullOrganogramaTree data={data} />
      )}

      {data && !isCA && <UnitKPIs data={data} layout="grid" />}
    </div>
  );
}
