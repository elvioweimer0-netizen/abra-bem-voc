import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, Ban, Building, FileText } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";

const setorLabels: Record<string, string> = {
  acougue: "Açougue", padaria: "Padaria", hortifruti: "Hortifruti",
  mercearia: "Mercearia", frente_de_caixa: "Frente de Caixa", deposito: "Depósito",
};

export default function Relatorios() {
  const { profile } = useAuth();
  const [counts, setCounts] = useState({ colaboradores: 0, advertencias: 0, suspensoes: 0 });
  const [ocorrenciasPorSetor, setOcorrenciasPorSetor] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      const [colabs, advs, susps, ocors] = await Promise.all([
        supabase.from("colaboradores").select("id", { count: "exact", head: true }),
        supabase.from("advertencias").select("id", { count: "exact", head: true }),
        supabase.from("suspensoes").select("id", { count: "exact", head: true }),
        supabase.from("ocorrencias").select("setor"),
      ]);

      setCounts({
        colaboradores: colabs.count || 0,
        advertencias: advs.count || 0,
        suspensoes: susps.count || 0,
      });

      const bySetor: Record<string, number> = {};
      (ocors.data || []).forEach((o) => {
        bySetor[o.setor] = (bySetor[o.setor] || 0) + 1;
      });
      setOcorrenciasPorSetor(bySetor);
    };

    fetchData();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-primary" /> Relatórios</h1>
        <p className="text-muted-foreground">Resumo geral filtrado por unidade</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total de Colaboradores" value={counts.colaboradores} icon={Users} color="primary" />
        <StatCard title="Total de Advertências" value={counts.advertencias} icon={AlertTriangle} color="warning" />
        <StatCard title="Total de Suspensões" value={counts.suspensoes} icon={Ban} color="destructive" />
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building className="w-5 h-5 text-primary" />
            Ocorrências por Setor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Constants.public.Enums.setor_tipo.map((setor) => {
              const count = ocorrenciasPorSetor[setor] || 0;
              const maxCount = Math.max(...Object.values(ocorrenciasPorSetor), 1);
              return (
                <div key={setor} className="flex items-center gap-4">
                  <span className="text-sm w-36 shrink-0">{setorLabels[setor]}</span>
                  <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${Math.max((count / maxCount) * 100, count > 0 ? 10 : 0)}%` }}
                    >
                      {count > 0 && <span className="text-xs font-medium text-primary-foreground">{count}</span>}
                    </div>
                  </div>
                  {count === 0 && <span className="text-xs text-muted-foreground">0</span>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
