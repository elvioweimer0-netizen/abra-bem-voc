import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Video, Smile, Meh, Frown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

const db = supabase as any;

type Row = {
  id: string;
  type: string;
  unit_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  title: string;
  ended_at: string | null;
  minute?: { sentiment: string | null; titulo: string | null; executive_summary: string | null }[] | null;
};

type Unit = { id: string; code: string; name: string };

const sentimentIcon: Record<string, JSX.Element> = {
  positivo: <Smile className="w-4 h-4 text-success" />,
  neutro: <Meh className="w-4 h-4 text-muted-foreground" />,
  tenso: <Frown className="w-4 h-4 text-destructive" />,
};

export default function HistoricoReunioes() {
  const [rows, setRows] = useState<Row[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tipo, setTipo] = useState("todos");
  const [unidade, setUnidade] = useState("todas");
  const [periodo, setPeriodo] = useState("30");

  useEffect(() => {
    db.from("units").select("id, code, name").eq("active", true).order("code").then(({ data }: any) => setUnits(data || []));
  }, []);

  useEffect(() => {
    const since = new Date(Date.now() - parseInt(periodo, 10) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    let q = db.from("leadership_meetings")
      .select("id, type, unit_id, scheduled_date, scheduled_time, status, title, ended_at, minute:meeting_minutes(sentiment, titulo, executive_summary)")
      .in("status", ["encerrada", "cancelada"])
      .gte("scheduled_date", since)
      .order("scheduled_date", { ascending: false })
      .order("scheduled_time", { ascending: false })
      .limit(200);
    if (tipo !== "todos") q = q.eq("type", tipo);
    if (unidade !== "todas") q = q.eq("unit_id", unidade);
    q.then(({ data }: any) => setRows((data as Row[]) || []));
  }, [tipo, unidade, periodo]);

  const unitMap = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u.code])), [units]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="w-6 h-6 text-primary" /> Histórico de Reuniões
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Reuniões finalizadas, com ata gerada pela IA.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="diaria">Diária</SelectItem>
            <SelectItem value="semanal">Semanal</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={unidade} onValueChange={setUnidade}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as lojas</SelectItem>
            {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.code} · {u.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <Card className="card-shadow"><CardContent className="py-12 text-center text-muted-foreground">
          <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma reunião neste filtro.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const minute = Array.isArray(r.minute) ? r.minute[0] : (r.minute as any);
            const sentiment = minute?.sentiment || "neutro";
            return (
              <Card key={r.id} className="card-shadow">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {sentimentIcon[sentiment]}
                      <h3 className="font-semibold text-sm text-foreground truncate">{minute?.titulo || r.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(parseISO(r.scheduled_date), "dd/MM/yyyy", { locale: ptBR })} · {r.scheduled_time?.slice(0, 5)} · {r.type} {r.unit_id ? `· ${unitMap[r.unit_id] || ""}` : ""}
                    </p>
                    {minute?.executive_summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{minute.executive_summary}</p>}
                  </div>
                  <Badge variant={r.status === "cancelada" ? "destructive" : "secondary"} className="text-[10px]">
                    {r.status === "cancelada" ? "Cancelada" : "Finalizada"}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="text-xs text-muted-foreground"><Link to="/reunioes" className="underline">← Voltar para Reuniões</Link></div>
    </div>
  );
}
