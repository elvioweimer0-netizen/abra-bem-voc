import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Video, ExternalLink } from "lucide-react";

interface Reuniao {
  id: string;
  titulo: string;
  descricao: string | null;
  data: string;
  horario: string;
  duracao_minutos: number;
  tipo: string;
  status: string;
  link: string | null;
  unidade: string | null;
}

const statusLabel: Record<string, string> = {
  agendada: "Agendada",
  em_andamento: "Ao vivo",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

const statusColor: Record<string, string> = {
  agendada: "bg-highlight/15 text-highlight-foreground",
  em_andamento: "bg-success/10 text-success",
  finalizada: "bg-muted text-muted-foreground",
  cancelada: "bg-destructive/10 text-destructive",
};

export default function AgendaReunioes() {
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);

  useEffect(() => {
    supabase
      .from("reunioes")
      .select("*")
      .order("data", { ascending: true })
      .order("horario", { ascending: true })
      .then(({ data }) => setReunioes((data as Reuniao[]) || []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-primary" /> Agenda de Reuniões
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Todas as reuniões agendadas</p>
      </div>

      {reunioes.length === 0 ? (
        <Card className="card-shadow">
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma reunião na agenda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reunioes.map((r) => (
            <Card key={r.id} className="card-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">{r.titulo}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")} · {r.horario?.slice(0, 5)} · {r.duracao_minutos}min · {r.tipo}
                  </p>
                  {r.unidade && <span className="text-[10px] text-muted-foreground">{r.unidade}</span>}
                </div>
                <Badge className={`text-[10px] ${statusColor[r.status] || ""}`}>
                  {statusLabel[r.status] || r.status}
                </Badge>
                {r.link && r.status !== "finalizada" && r.status !== "cancelada" && (
                  <Button size="sm" variant="outline" className="gap-1 text-xs" asChild>
                    <a href={r.link} target="_blank" rel="noopener noreferrer">
                      Entrar <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
