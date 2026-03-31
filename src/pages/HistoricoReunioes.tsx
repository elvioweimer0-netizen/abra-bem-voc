import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Video } from "lucide-react";

interface Reuniao {
  id: string;
  titulo: string;
  data: string;
  horario: string;
  tipo: string;
  status: string;
  unidade: string | null;
  observacoes: string | null;
}

export default function HistoricoReunioes() {
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);

  useEffect(() => {
    supabase
      .from("reunioes")
      .select("*")
      .in("status", ["finalizada", "cancelada"])
      .order("data", { ascending: false })
      .limit(50)
      .then(({ data }) => setReunioes((data as Reuniao[]) || []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="w-6 h-6 text-primary" /> Histórico de Reuniões
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Reuniões finalizadas e canceladas</p>
      </div>

      {reunioes.length === 0 ? (
        <Card className="card-shadow">
          <CardContent className="py-12 text-center text-muted-foreground">
            <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma reunião no histórico ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reunioes.map((r) => (
            <Card key={r.id} className="card-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">{r.titulo}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")} · {r.horario?.slice(0, 5)} · {r.tipo}
                  </p>
                  {r.observacoes && <p className="text-xs text-muted-foreground mt-1">{r.observacoes}</p>}
                </div>
                <Badge variant={r.status === "cancelada" ? "destructive" : "secondary"} className="text-[10px]">
                  {r.status === "cancelada" ? "Cancelada" : "Finalizada"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
