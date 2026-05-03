import { Link, Navigate } from "react-router-dom";
import { Building2, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";

export default function UnidadesIndex() {
  const { data, isLoading } = useAccessibleUnits();

  if (!isLoading && data && data.length === 1) {
    return <Navigate to={`/unidade/${data[0].id}`} replace />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Unidades</h1>
        <p className="text-sm text-muted-foreground">Selecione uma unidade para ver organograma e indicadores</p>
      </div>
      {isLoading ? (
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((u) => (
            <Link key={u.id} to={`/unidade/${u.id}`}>
              <Card className="transition hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.code}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
          {(data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma unidade acessível.</p>
          )}
        </div>
      )}
    </div>
  );
}
