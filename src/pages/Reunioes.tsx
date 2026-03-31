import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Clock, Users, ExternalLink } from "lucide-react";

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

const statusColor: Record<string, string> = {
  agendada: "bg-highlight/15 text-highlight-foreground",
  em_andamento: "bg-success/10 text-success",
  finalizada: "bg-muted text-muted-foreground",
  cancelada: "bg-destructive/10 text-destructive",
};

export default function Reunioes() {
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);

  useEffect(() => {
    supabase
      .from("reunioes")
      .select("*")
      .in("status", ["agendada", "em_andamento"])
      .order("data", { ascending: true })
      .then(({ data }) => setReunioes((data as Reuniao[]) || []));
  }, []);

  const hoje = new Date().toISOString().split("T")[0];
  const reunioesHoje = reunioes.filter((r) => r.data === hoje);
  const reunioesFuturas = reunioes.filter((r) => r.data > hoje);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sala de Reunião Online</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe e participe das reuniões da sua unidade
        </p>
      </div>

      {reunioesHoje.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">📅 Reuniões de hoje</h2>
          {reunioesHoje.map((r) => (
            <ReuniaoCard key={r.id} reuniao={r} />
          ))}
        </div>
      )}

      {reunioesFuturas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">📋 Próximas reuniões</h2>
          {reunioesFuturas.map((r) => (
            <ReuniaoCard key={r.id} reuniao={r} />
          ))}
        </div>
      )}

      {reunioes.length === 0 && (
        <Card className="card-shadow">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma reunião agendada no momento.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReuniaoCard({ reuniao }: { reuniao: Reuniao }) {
  return (
    <Card className="card-shadow hover:card-shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Video className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground">{reuniao.titulo}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {reuniao.horario?.slice(0, 5)} · {reuniao.duracao_minutos}min
            </span>
            <span>{new Date(reuniao.data + "T00:00:00").toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
        <Badge className={`text-[10px] ${statusColor[reuniao.status] || ""}`}>
          {reuniao.status === "em_andamento" ? "Ao vivo" : reuniao.status}
        </Badge>
        {reuniao.link && (
          <Button size="sm" className="gap-1.5 text-xs" asChild>
            <a href={reuniao.link} target="_blank" rel="noopener noreferrer">
              Entrar <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
