import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronDown, FileText, Mic, Plus, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const db = supabase as any;

type Unit = { id: string; code: string; name: string };
type Meeting = { id: string; type: string; unit_id: string | null; scheduled_date: string; scheduled_time: string; status: string; title: string; minutes?: string | null; is_monthly_in_person?: boolean };
type Occurrence = { id: string; descricao: string; gravidade: string; unit_id: string; criado_em: string };
type Notice = { id: string; titulo: string; created_at: string };
type MeetingMinute = { id: string; meeting_id: string; executive_summary: string | null; decisions: any[]; action_items: any[]; attention_points: any[]; sentiment: string | null; transcript: string | null; processing_status: string; error_message: string | null };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function minutesTo930() {
  const now = new Date();
  const target = new Date();
  target.setHours(9, 30, 0, 0);
  const diff = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 60000));
  return `${String(Math.floor(diff / 60)).padStart(2, "0")}:${String(diff % 60).padStart(2, "0")}`;
}

export default function ReunioesLideranca() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sale, setSale] = useState("");
  const [goal, setGoal] = useState("");
  const [freeAgenda, setFreeAgenda] = useState("");
  const [decisions, setDecisions] = useState("");

  useEffect(() => {
    const load = async () => {
      const yesterday = yesterdayISO();
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [{ data: unitData }, { data: meetingData }, { data: boData }, { data: noticeData }, { data: minuteData }] = await Promise.all([
        db.from("units").select("id, code, name").eq("active", true).order("code"),
        db.from("leadership_meetings").select("id, type, unit_id, scheduled_date, scheduled_time, status, title, minutes, is_monthly_in_person").eq("scheduled_date", todayISO()).order("scheduled_time"),
        db.from("leadership_occurrences").select("id, descricao, gravidade, unit_id, criado_em").gte("criado_em", `${yesterday}T00:00:00`).lt("criado_em", `${todayISO()}T00:00:00`).in("gravidade", ["media", "alta"]),
        db.from("avisos").select("id, titulo, created_at").gte("created_at", since).eq("ativo", true).order("created_at", { ascending: false }),
        db.from("meeting_minutes").select("id, meeting_id, executive_summary, decisions, action_items, attention_points, sentiment, transcript, processing_status, error_message").order("created_at", { ascending: false }).limit(20),
      ]);
      setUnits(unitData || []);
      setMeetings(meetingData || []);
      setOccurrences(boData || []);
      setNotices(noticeData || []);
      setMinutes(minuteData || []);
    };
    load();
  }, []);

  const isTuesday = new Date().getDay() === 2;
  const dailyMeeting = meetings.find((m) => m.type === "diaria");
  const weeklyMeeting = meetings.find((m) => m.type === "semanal");
  const individualMeetings = meetings.filter((m) => m.type === "individual");
  const weeklyStats = useMemo(() => units.map((unit, index) => ({ unit, percent: Math.max(45, 96 - index * 8) })), [units]);

  const ensureMeeting = async (type: "diaria" | "semanal", title: string) => {
    if (!user) return null;
    const existing = meetings.find((m) => m.type === type);
    if (existing) return existing;
    const { data } = await db.from("leadership_meetings").insert({ type, title, scheduled_date: todayISO(), scheduled_time: "09:30", created_by: user.id }).select("id, type, unit_id, scheduled_date, scheduled_time, status, title").single();
    if (data) setMeetings((current) => [...current, data]);
    return data;
  };

  const joinDaily = async () => {
    const meeting = await ensureMeeting("diaria", "Reunião Diária");
    if (!meeting || !user) return;
    const { data, error } = await supabase.functions.invoke("create-daily-room", {
      body: { meetingId: meeting.id, title: meeting.title },
    });
    if (data?.plan_error) {
      toast({ title: "Gravação indisponível", description: data.error, variant: "destructive" });
      return;
    }
    if (error || !data?.url) {
      toast({ title: "Erro ao iniciar sala", description: error?.message || data?.error || "Não foi possível criar a sala Daily.co.", variant: "destructive" });
      return;
    }
    await db.from("leadership_meetings").update({ status: "em_andamento" }).eq("id", meeting.id);
    await db.from("meeting_attendees").upsert({ meeting_id: meeting.id, user_id: user.id, role_label: profile?.cargo, present: true, joined_at: new Date().toISOString() }, { onConflict: "meeting_id,user_id" });
    toast({ title: "Sala iniciada", description: "Abrindo a reunião diária no Daily.co." });
    window.open(data.url, "_blank", "noopener,noreferrer");
  };

  const uploadManualRecording = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const meeting = dailyMeeting;
    if (!file || !meeting) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("meetingId", meeting.id);
      form.append("file", file);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-meeting-recording`, {
        method: "POST",
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: form,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Falha ao processar gravação");
      toast({ title: "Gravação enviada", description: "A ata será gerada automaticamente em alguns minutos." });
    } catch (error) {
      toast({ title: "Erro no upload", description: error instanceof Error ? error.message : "Não foi possível enviar a gravação.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const closeMeeting = async (meeting?: Meeting) => {
    if (!meeting) return;
    const minutes = [
      `ATA - ${meeting.title} (${new Date().toLocaleDateString("pt-BR")})`,
      `Participante: ${profile?.nome || "Usuário"}`,
      `B.O.s discutidos: ${occurrences.map((o) => o.descricao).join("; ") || "sem registros críticos"}`,
      `Informativos: ${notices.map((n) => n.titulo).join("; ") || "sem novos avisos"}`,
      `Venda anterior: ${sale || "não informada"}`,
      `Metas do dia: ${goal || "não informadas"}`,
      `Decisões: ${decisions || "sem decisões registradas"}`,
    ].join("\n");
    await db.from("leadership_meetings").update({ status: "encerrada", minutes, decisions, ended_at: new Date().toISOString() }).eq("id", meeting.id);
    await db.from("notification_events").insert({ type: "meeting_minutes", title: "ATA disponível", body: `A ata de ${meeting.title} foi gerada.`, payload: { meeting_id: meeting.id } });
    toast({ title: "ATA gerada", description: "Registro salvo e notificação preparada." });
  };

  const generateWeekly = async () => {
    const meeting = await ensureMeeting("semanal", "Reunião Semanal");
    if (meeting) await closeMeeting(meeting);
  };

  const dailyMinute = dailyMeeting ? minutes.find((minute) => minute.meeting_id === dailyMeeting.id) : undefined;

  return (
    <div className="space-y-5">
      <section className="rounded-xl bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Cobrança da Liderança</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Reuniões</h1>
      </section>

      <Tabs defaultValue="diaria" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-muted p-1">
          <TabsTrigger value="diaria" className="min-h-11">Diária</TabsTrigger>
          <TabsTrigger value="semanal" className="min-h-11">Semanal</TabsTrigger>
          <TabsTrigger value="individual" className="min-h-11">Individual</TabsTrigger>
        </TabsList>

        <TabsContent value="diaria" className="space-y-4">
          {isTuesday && <Card className="border-warning bg-warning/10"><CardContent className="p-4 font-semibold text-warning">Hoje é Reunião Semanal — pule a Diária</CardContent></Card>}
          <Card className="border-primary/30 bg-primary/10">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-xl font-bold text-foreground">Reunião Diária de hoje — 9:30</h2><p className="mt-1 text-sm text-muted-foreground">{minutesTo930()} restantes</p></div>
                <CalendarClock className="h-8 w-8 text-primary" />
              </div>
              <Button className="mt-4 min-h-12 w-full gap-2" onClick={joinDaily}><Mic className="h-5 w-5" /> Entrar/Iniciar</Button>
              <div className="mt-3">
                <Input id="manual-recording" type="file" accept="audio/*,video/*" className="hidden" onChange={uploadManualRecording} disabled={uploading || !dailyMeeting} />
                <Button variant="outline" className="min-h-12 w-full gap-2 bg-card" asChild disabled={uploading || !dailyMeeting}>
                  <label htmlFor="manual-recording"><Upload className="h-5 w-5" /> {uploading ? "Processando..." : "Subir gravação manual"}</label>
                </Button>
              </div>
            </CardContent>
          </Card>

          {dailyMinute && <MinutesCard minute={dailyMinute} />}

          <Card><CardHeader><CardTitle>Pauta automática</CardTitle></CardHeader><CardContent className="space-y-4">
            <div><p className="font-semibold">1. B.O. do dia anterior</p>{occurrences.length ? occurrences.map((o) => <p key={o.id} className="text-sm text-muted-foreground">• {o.descricao}</p>) : <p className="text-sm text-muted-foreground">Sem B.O.s médios/altos ontem.</p>}</div>
            <div><p className="font-semibold">2. Informativos novos</p>{notices.length ? notices.map((n) => <p key={n.id} className="text-sm text-muted-foreground">• {n.titulo}</p>) : <p className="text-sm text-muted-foreground">Sem avisos nas últimas 24h.</p>}</div>
            <Input placeholder="3. Venda do dia anterior por loja" value={sale} onChange={(e) => setSale(e.target.value)} />
            <Input placeholder="4. Metas do dia por loja" value={goal} onChange={(e) => setGoal(e.target.value)} />
            <Textarea placeholder="Decisões tomadas" value={decisions} onChange={(e) => setDecisions(e.target.value)} />
            <Button variant="outline" className="min-h-12 w-full gap-2" onClick={() => closeMeeting(dailyMeeting)}><FileText className="h-5 w-5" /> Encerrar reunião e gerar ATA</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="semanal" className="space-y-4">
          <Card><CardHeader><CardTitle>Performance da semana</CardTitle></CardHeader><CardContent className="space-y-3">{weeklyStats.map((row) => <div key={row.unit.id}><div className="flex justify-between text-sm"><span>{row.unit.name}</span><strong>{row.percent}%</strong></div><div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${row.percent}%` }} /></div></div>)}</CardContent></Card>
          <Card><CardContent className="space-y-3 p-4"><p className="font-semibold">Quebras/perdas da semana</p><Input placeholder="Resumo das perdas por unidade" /><p className="font-semibold">B.O.s mais relevantes</p>{occurrences.slice(0, 3).map((o) => <Badge key={o.id} variant="outline" className="mr-2">{o.descricao}</Badge>)}<Textarea placeholder="Pauta livre — até 2 itens por gerente" value={freeAgenda} onChange={(e) => setFreeAgenda(e.target.value)} /><Button variant="outline" className="min-h-12 w-full"><Plus className="mr-2 h-5 w-5" /> Adicionar DP/RH/Marketing</Button><Button className="min-h-12 w-full" onClick={generateWeekly}>Gerar ATA</Button></CardContent></Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-3">
          {individualMeetings.map((meeting) => {
            const unit = units.find((u) => u.id === meeting.unit_id);
            return <Card key={meeting.id}><CardContent className="p-4"><div className="flex items-start justify-between"><div><h3 className="font-bold text-foreground">{unit?.name || meeting.title}</h3><p className="text-sm text-muted-foreground">{meeting.scheduled_time.slice(0, 5)} • {meeting.is_monthly_in_person ? "Presencial" : "Online"}</p></div><Badge>{meeting.status}</Badge></div><div className="mt-3 space-y-2 text-sm text-muted-foreground"><p>• Números da semana</p><p>• Top 3 problemas dessa loja</p><Input placeholder="O que melhorar" /></div><Button className="mt-3 min-h-12 w-full" onClick={() => closeMeeting(meeting)}>Gerar ATA e enviar</Button></CardContent></Card>;
          })}
          {!individualMeetings.length && <Card><CardContent className="p-4 text-sm text-muted-foreground">Agenda individual será exibida conforme o calendário da semana.</CardContent></Card>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
