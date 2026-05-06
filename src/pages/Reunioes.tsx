import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, History, ListChecks, Users, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DailySalaFrame } from "@/components/reunioes/DailySalaFrame";

const db = supabase as any;

type MeetingType = "diaria" | "semanal" | "individual";
type Meeting = {
  id: string;
  type: MeetingType | string;
  unit_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  title: string;
  agenda: any[] | null;
};
type Unit = { id: string; code: string; name: string };

const tabLabels: Record<MeetingType, string> = { diaria: "Diária", semanal: "Semanal", individual: "Individuais" };

export default function Reunioes() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<MeetingType>("diaria");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitFilter, setUnitFilter] = useState<string>("todos");
  const [agenda, setAgenda] = useState<string[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [activeRoom, setActiveRoom] = useState<{ url: string; meetingId: string } | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    db.from("units").select("id, code, name").eq("active", true).order("code").then(({ data }: any) => setUnits(data || []));
    db.from("leadership_meetings")
      .select("id, type, unit_id, scheduled_date, scheduled_time, status, title, agenda")
      .in("status", ["agendada", "em_andamento"])
      .gte("scheduled_date", new Date().toISOString().slice(0, 10))
      .order("scheduled_date").order("scheduled_time")
      .then(({ data }: any) => setMeetings((data as Meeting[]) || []));
  }, []);

  const next = useMemo(() => {
    const filtered = meetings.filter((m) => m.type === activeTab && (activeTab !== "individual" || unitFilter === "todos" || m.unit_id === unitFilter));
    return filtered[0] || null;
  }, [meetings, activeTab, unitFilter]);

  useEffect(() => {
    setLoadingAgenda(true);
    setAgenda([]);
    (async () => {
      try {
        if (next?.agenda && Array.isArray(next.agenda) && next.agenda.length > 0) {
          setAgenda(next.agenda.map((a: any) => a.titulo || a.descricao || String(a)).filter(Boolean));
        } else {
          // Fallback: B.O. eletrônico recente + ações pendentes
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const [boRes, actionsRes] = await Promise.all([
            db.from("leadership_occurrences").select("descricao").gte("criado_em", yesterday).limit(5),
            db.from("meeting_action_items").select("descricao").eq("status", "pendente").order("created_at", { ascending: false }).limit(5),
          ]);
          const items: string[] = [];
          (boRes.data || []).forEach((b: any) => items.push("📌 " + b.descricao));
          (actionsRes.data || []).forEach((a: any) => items.push("✅ Pendente: " + a.descricao));
          if (items.length === 0) items.push("Nenhum item registrado. Use a reunião para alinhar prioridades do dia.");
          setAgenda(items);
        }
      } finally {
        setLoadingAgenda(false);
      }
    })();
  }, [next?.id]);

  const handleEnter = async () => {
    if (!next && !confirm("Não há reunião agendada. Criar uma sala instantânea agora?")) return;
    setJoining(true);
    try {
      let meetingId = next?.id;
      let title = next?.title;
      if (!meetingId) {
        const { data: created, error } = await db.from("leadership_meetings").insert({
          type: activeTab,
          unit_id: activeTab === "individual" && unitFilter !== "todos" ? unitFilter : null,
          scheduled_date: new Date().toISOString().slice(0, 10),
          scheduled_time: new Date().toTimeString().slice(0, 8),
          status: "em_andamento",
          title: `Reunião ${tabLabels[activeTab]} ${format(new Date(), "dd/MM HH:mm")}`,
          created_by: profile?.user_id || null,
        }).select("id, title").single();
        if (error) throw error;
        meetingId = created.id;
        title = created.title;
      }
      const { data, error } = await supabase.functions.invoke("create-daily-room", {
        body: { meetingId, title, type: activeTab },
      });
      if (error) throw error;
      const url = (data as any)?.url;
      if (!url) throw new Error("Sala não retornou URL");
      await db.from("leadership_meetings").update({ status: "em_andamento" }).eq("id", meetingId);
      setActiveRoom({ url, meetingId: meetingId! });
    } catch (err: any) {
      toast.error("Não consegui abrir a sala: " + (err?.message || "erro"));
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (activeRoom) {
      await db.from("leadership_meetings").update({ status: "encerrada", ended_at: new Date().toISOString() }).eq("id", activeRoom.meetingId);
    }
    setActiveRoom(null);
  };



  if (activeRoom) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Reunião em andamento</h1>
          <Button variant="outline" onClick={handleLeave}>Sair da sala</Button>
        </div>
        <DailySalaFrame roomUrl={activeRoom.url} meetingId={activeRoom.meetingId} onLeave={handleLeave} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reuniões Online</h1>
          <p className="text-sm text-muted-foreground mt-1">Sala de vídeo + ata automática + ações pra todos verem.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/reunioes/historico"><History className="w-4 h-4 mr-1" /> Histórico</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/tarefas"><ListChecks className="w-4 h-4 mr-1" /> Tarefas</Link></Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MeetingType)}>
        <TabsList>
          <TabsTrigger value="diaria">Diária</TabsTrigger>
          <TabsTrigger value="semanal">Semanal</TabsTrigger>
          <TabsTrigger value="individual">Individuais</TabsTrigger>
        </TabsList>

        {(["diaria", "semanal", "individual"] as MeetingType[]).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2 card-shadow border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Video className="w-5 h-5 text-primary" /> Próxima reunião {tabLabels[tab]}
                    </CardTitle>
                    {tab === "individual" && (
                      <Select value={unitFilter} onValueChange={setUnitFilter}>
                        <SelectTrigger className="w-48 h-8"><SelectValue placeholder="Unidade" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todas as lojas</SelectItem>
                          {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.code} · {u.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {next ? (
                    <div className="space-y-2">
                      <div className="text-xl font-semibold">{next.title}</div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(parseISO(next.scheduled_date), "EEEE dd/MM", { locale: ptBR })}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{next.scheduled_time?.slice(0, 5)}</span>
                        <Badge variant={next.status === "em_andamento" ? "default" : "secondary"}>{next.status === "em_andamento" ? "Ao vivo" : "Agendada"}</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground py-4 flex items-center gap-2"><Users className="w-4 h-4" /> Sem reunião {tabLabels[tab].toLowerCase()} agendada. Crie uma sala instantânea.</div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Button size="lg" onClick={handleEnter} disabled={joining} className="gap-2">
                      <Video className="w-4 h-4" /> {joining ? "Abrindo sala…" : "Entrar na Sala"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-shadow">
                <CardHeader><CardTitle className="text-base">Pauta automática</CardTitle></CardHeader>
                <CardContent>
                  {loadingAgenda ? (
                    <div className="text-sm text-muted-foreground">Carregando…</div>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {agenda.map((it, i) => <li key={i} className="border-l-2 border-primary/40 pl-3 text-foreground/90">{it}</li>)}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
