import { useEffect } from "react";
import { KpiRedeBar } from "@/components/master/KpiRedeBar";
import { UnidadesGrid } from "@/components/master/UnidadesGrid";
import { AlertasCriticosRede } from "@/components/master/AlertasCriticosRede";
import { useQueryClient } from "@tanstack/react-query";

export default function MasterTV() {
  const qc = useQueryClient();
  useEffect(() => {
    const t = setInterval(() => qc.invalidateQueries(), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [qc]);

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Centro de Comando — Curió</h1>
        <p className="text-sm text-muted-foreground">Atualiza a cada 5 minutos · {new Date().toLocaleTimeString("pt-BR")}</p>
      </header>
      <KpiRedeBar />
      <UnidadesGrid />
      <AlertasCriticosRede />
    </div>
  );
}
