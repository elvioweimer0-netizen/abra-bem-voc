import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarClock, ChevronDown, Clock, FileText, Frown, Meh, Mic, Plus, RefreshCw, Smile, Upload, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

const db = supabase as any;

type Unit = { id: string; code: string; name: string };
type Meeting = { id: string; type: string; unit_id: string | null; scheduled_date: string; scheduled_time: string; status: string; title: string; minutes?: string | null; is_monthly_in_person?: boolean; ended_at?: string | null; created_at?: string };
type Occurrence = { id: string; descricao: string; gravidade: string; unit_id: string; criado_em: string };
type Notice = { id: string; titulo: string; created_at: string };
type MeetingMinute = { id: string; meeting_id: string; executive_summary: string | null; decisions: any[]; action_items: any[]; attention_points: any[]; sentiment: string | null; transcript: string | null; processing_status: string; error_message: string | null; recording_url?: string | null; recording_file_path?: string | null };
type MeetingAttendee = { id: string; meeting_id: string; user_id: string; role_label: string | null; present: boolean; joined_at: string | null };

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

function formatMeetingType(type: string) {
  const labels: Record<string, string> = { diaria: "Diária", semanal: "Semanal", individual: "Individual" };
  return labels[type] || type;
}

function formatDuration(meeting: Meeting) {
  if (!meeting.ended_at) return "—";
  const start = new Date(`${meeting.scheduled_date}T${meeting.scheduled_time}`);
  const end = new Date(meeting.ended_at);
  const minutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  if (!Number.isFinite(minutes)) return "—";
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}min` : `${minutes}min`;
}

export default function ReunioesLideranca() {
  const { user, profile } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [historyMeetings, setHistoryMeetings] = useState<Meeting[]>([]);
  const [attendees, setAttendees] = useState<MeetingAttendee[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [retryingMinuteId, setRetryingMinuteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [joiningDaily, setJoiningDaily] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [processingRecording, setProcessingRecording] = useState(false);
  const [sale, setSale] = useState("");
  const [goal, setGoal] = useState("");
  const [freeAgenda, setFreeAgenda] = useState("");
  const [decisions, setDecisions] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingMeetingRef = useRef<Meeting | null>(null);
  const maxRecordingTimerRef = useRef<number | null>(null);
  const minuteStatusRef = useRef<Record<string, string>>({});

  const loadHistory = async (notifyReady = false) => {
    const [{ data: historyData }, { data: minuteData }, { data: attendeeData }] = await Promise.all([
      db.from("leadership_meetings").select("id, type, unit_id, scheduled_date, scheduled_time, status, title, ended_at, created_at, is_monthly_in_person").eq("status", "encerrada").order("ended_at", { ascending: false, nullsFirst: false }).limit(100),
      db.from("meeting_minutes").select("id, meeting_id, executive_summary, decisions, action_items, attention_points, sentiment, transcript, processing_status, error_message, recording_url, recording_file_path").order("created_at", { ascending: false }).limit(100),
      db.from("meeting_attendees").select("id, meeting_id, user_id, role_label, present, joined_at").eq("present", true).order("joined_at", { ascending: true }),
    ]);
    if (notifyReady) {
      (minuteData || []).forEach((minute: MeetingMinute) => {
        if (minute.processing_status === "completed" && minuteStatusRef.current[minute.meeting_id] && minuteStatusRef.current[minute.meeting_id] !== "completed") {
          toast.success("Nova ata pronta! Tocar para ver.", { action: { label: "Ver", onClick: () => setSelectedHistoryId(minute.meeting_id) } });
        }
      });
    }
    minuteStatusRef.current = Object.fromEntries((minuteData || []).map((minute: MeetingMinute) => [minute.meeting_id, minute.processing_status]));
    setHistoryMeetings(historyData || []);
    setMinutes(minuteData || []);
    setAttendees(attendeeData || []);
  };

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
      loadHistory();
    };
    load();
  }, []);

  useEffect(() => {
    const channel = db
      .channel("meeting-minutes-ready")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "meeting_minutes" }, (payload: any) => {
        if (payload.new?.processing_status === "completed" && payload.old?.processing_status !== "completed") {
          loadHistory(true);
          toast.success("Nova ata pronta! Tocar para ver.", { action: { label: "Ver", onClick: () => setSelectedHistoryId(payload.new.meeting_id) } });
        }
      })
      .subscribe();
    const interval = window.setInterval(() => loadHistory(true), 30000);
    return () => {
      window.clearInterval(interval);
      db.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (maxRecordingTimerRef.current) window.clearTimeout(maxRecordingTimerRef.current);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      streamRef.current = null;
      chunksRef.current = [];
    };
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

  const startLocalRecording = async (meeting: Meeting) => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      throw new Error("Este navegador não suporta gravação local. Use o botão Subir gravação manual.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
    const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    };
    recorderRef.current = recorder;
    streamRef.current = stream;
    recordingMeetingRef.current = meeting;
    recorder.start(1000);
    setIsRecording(true);
    maxRecordingTimerRef.current = window.setTimeout(() => {
      if (recorderRef.current?.state === "recording") {
        toast.warning("Limite de gravação atingido", { description: "A gravação foi encerrada automaticamente após 90 minutos." });
        stopRecordingAndProcess();
      }
    }, 90 * 60 * 1000);
  };

  const processRecordingBlob = async (meeting: Meeting, audioBlob: Blob) => {
    const path = `${meeting.id}/${Date.now()}-reuniao-diaria.webm`;
    const file = new File([audioBlob], "reuniao-diaria.webm", { type: audioBlob.type || "audio/webm" });
    const { error: uploadError } = await supabase.storage.from("meeting-recordings").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) throw uploadError;

    const { data: signed, error: signedError } = await supabase.storage.from("meeting-recordings").createSignedUrl(path, 60 * 60);
    if (signedError || !signed?.signedUrl) throw signedError || new Error("Não foi possível gerar URL da gravação.");

    const { data, error } = await supabase.functions.invoke("process-meeting-recording", {
      body: { meetingId: meeting.id, recording_url: signed.signedUrl, recording_file_path: path },
    });
    if (error || data?.error) throw new Error(error?.message || data.error);

    await db.from("leadership_meetings").update({ status: "encerrada", decisions, ended_at: new Date().toISOString() }).eq("id", meeting.id);
    setMinutes((current) => [{ id: `processing-${meeting.id}`, meeting_id: meeting.id, executive_summary: null, decisions: [], action_items: [], attention_points: [], sentiment: null, transcript: null, processing_status: "processing", error_message: null }, ...current.filter((minute) => minute.meeting_id !== meeting.id)]);
  };

  const stopRecordingAndProcess = async () => {
    const meeting = recordingMeetingRef.current || dailyMeeting;
    if (!meeting) return;
    setProcessingRecording(true);
    try {
      if (maxRecordingTimerRef.current) window.clearTimeout(maxRecordingTimerRef.current);
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") throw new Error("Nenhuma gravação local ativa encontrada.");
      const stopped = new Promise<void>((resolve) => {
        const previous = recorder.onstop;
        recorder.onstop = (event) => {
          previous?.call(recorder, event);
          resolve();
        };
      });
      recorder.stop();
      await stopped;
      const audioBlob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      if (!audioBlob.size) throw new Error("A gravação ficou vazia. Use o upload manual como fallback.");
      await processRecordingBlob(meeting, audioBlob);
      toast.success("Processando ata... aguarde 2-3 min");
    } catch (error) {
      toast.error("Erro ao processar gravação", { description: error instanceof Error ? error.message : "Use o upload manual como fallback." });
    } finally {
      recorderRef.current = null;
      streamRef.current = null;
      chunksRef.current = [];
      recordingMeetingRef.current = null;
      setProcessingRecording(false);
    }
  };

  const joinDaily = async () => {
    if (joiningDaily) return;
    setJoiningDaily(true);
    console.log("[Daily.co] Entrar/Iniciar clicado");
    try {
      const meeting = await ensureMeeting("diaria", "Reunião Diária");
      if (!meeting || !user) return;

      await startLocalRecording(meeting);

      await db.from("leadership_meetings").update({ status: "encerrada", ended_at: new Date().toISOString() }).eq("type", "diaria").eq("status", "em_andamento").neq("id", meeting.id);

      const payload = { meetingId: meeting.id, title: meeting.title, type: meeting.type };
      console.log("[Daily.co] Payload enviado", payload);
      const { data, error } = await supabase.functions.invoke("create-daily-room", { body: payload });
      console.log("[Daily.co] Resposta da API", { data, error });

      if (data?.plan_error) {
        const message = `${data.error || "Plano Daily.co não suporta gravação."}${data.details ? ` Detalhes: ${data.details}` : ""}`;
        toast.error("Gravação indisponível", { description: message });
        return;
      }
      if (error || !data?.url) {
        const message = error?.message || data?.error || "Não foi possível criar a sala Daily.co.";
        console.error("[Daily.co] Erro ao criar sala", { error, data });
        toast.error("Erro ao iniciar sala", { description: message });
        return;
      }

      await db.from("leadership_meetings").update({ status: "em_andamento" }).eq("id", meeting.id);
      await db.from("meeting_attendees").upsert({ meeting_id: meeting.id, user_id: user.id, role_label: profile?.cargo, present: true, joined_at: new Date().toISOString() }, { onConflict: "meeting_id,user_id" });
      toast.success("Sala iniciada", { description: "Gravação local ativa no navegador." });
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("[Daily.co] Falha no clique Entrar/Iniciar", error);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      toast.error("Erro ao iniciar sala", { description: error instanceof Error ? error.message : "Erro desconhecido." });
    } finally {
      setJoiningDaily(false);
    }
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
      toast.success("Gravação enviada", { description: "A ata será gerada automaticamente em alguns minutos." });
    } catch (error) {
      toast.error("Erro no upload", { description: error instanceof Error ? error.message : "Não foi possível enviar a gravação." });
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
    toast.success("ATA gerada", { description: "Registro salvo e notificação preparada." });
  };

  const generateWeekly = async () => {
    const meeting = await ensureMeeting("semanal", "Reunião Semanal");
    if (meeting) await closeMeeting(meeting);
  };

  const dailyMinute = dailyMeeting ? minutes.find((minute) => minute.meeting_id === dailyMeeting.id) : undefined;
  const selectedMeeting = historyMeetings.find((meeting) => meeting.id === selectedHistoryId);
  const selectedMinute = selectedMeeting ? minutes.find((minute) => minute.meeting_id === selectedMeeting.id) : undefined;
  const selectedAttendees = selectedMeeting ? attendees.filter((attendee) => attendee.meeting_id === selectedMeeting.id) : [];

  const retryMinute = async (minute: MeetingMinute) => {
    if (!minute.recording_url && !minute.recording_file_path) {
      toast.error("Sem gravação disponível", { description: "Suba a gravação manualmente para tentar novamente." });
      return;
    }
    setRetryingMinuteId(minute.id);
    try {
      const { data, error } = await supabase.functions.invoke("process-meeting-recording", {
        body: { meetingId: minute.meeting_id, recording_url: minute.recording_url, recording_file_path: minute.recording_file_path },
      });
      if (error || data?.error) throw new Error(error?.message || data.error);
      toast.success("Processando ata... aguarde 2-3 min");
      await loadHistory();
    } catch (error) {
      toast.error("Erro ao tentar novamente", { description: error instanceof Error ? error.message : "Não foi possível reprocessar a ata." });
    } finally {
      setRetryingMinuteId(null);
    }
  };

  if (selectedMeeting) {
    return <MeetingMinuteDetail meeting={selectedMeeting} minute={selectedMinute} attendees={selectedAttendees} onBack={() => setSelectedHistoryId(null)} onRefresh={() => loadHistory()} onRetry={retryMinute} retrying={retryingMinuteId === selectedMinute?.id} />;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Cobrança da Liderança</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Reuniões</h1>
      </section>

      <Tabs defaultValue="diaria" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-4 rounded-xl bg-muted p-1">
          <TabsTrigger value="diaria" className="min-h-11">Diária</TabsTrigger>
          <TabsTrigger value="semanal" className="min-h-11">Semanal</TabsTrigger>
          <TabsTrigger value="individual" className="min-h-11">Individual</TabsTrigger>
          <TabsTrigger value="historico" className="min-h-11">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="diaria" className="space-y-4">
          {isTuesday && <Card className="border-warning bg-warning/10"><CardContent className="p-4 font-semibold text-warning">Hoje é Reunião Semanal — pule a Diária</CardContent></Card>}
          <Card className="border-primary/30 bg-primary/10">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-xl font-bold text-foreground">Reunião Diária de hoje — 9:30</h2><p className="mt-1 text-sm text-muted-foreground">{minutesTo930()} restantes</p></div>
                <CalendarClock className="h-8 w-8 text-primary" />
              </div>
              {isRecording && <Badge className="mt-4 bg-destructive text-destructive-foreground">🔴 Gravando</Badge>}
              <Button className="mt-4 min-h-12 w-full gap-2" onClick={joinDaily} disabled={joiningDaily}><Mic className="h-5 w-5" /> {joiningDaily ? "Iniciando..." : "Entrar/Iniciar"}</Button>
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
            <Button variant="outline" className="min-h-12 w-full gap-2" onClick={isRecording ? stopRecordingAndProcess : () => closeMeeting(dailyMeeting)} disabled={processingRecording}><FileText className="h-5 w-5" /> {processingRecording ? "Processando..." : "Encerrar reunião e gerar ATA"}</Button>
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

        <TabsContent value="historico" className="space-y-3">
          <div className="flex justify-end"><Button variant="outline" className="gap-2" onClick={() => loadHistory()}><RefreshCw className="h-4 w-4" /> Atualizar</Button></div>
          {historyMeetings.map((meeting) => {
            const minute = minutes.find((item) => item.meeting_id === meeting.id);
            return <HistoryMeetingCard key={meeting.id} meeting={meeting} minute={minute} onOpen={() => setSelectedHistoryId(meeting.id)} onRefresh={() => loadHistory()} onRetry={retryMinute} retrying={retryingMinuteId === minute?.id} />;
          })}
          {!historyMeetings.length && <Card><CardContent className="p-4 text-sm text-muted-foreground">Nenhuma reunião encerrada encontrada.</CardContent></Card>}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MinutesCard({ minute }: { minute: MeetingMinute }) {
  const decisions = Array.isArray(minute.decisions) ? minute.decisions : [];
  const actionItems = Array.isArray(minute.action_items) ? minute.action_items : [];
  const attentionPoints = Array.isArray(minute.attention_points) ? minute.attention_points : [];

  if (minute.processing_status === "processing" || minute.processing_status === "pending") {
    return <Card><CardContent className="p-4 text-sm text-muted-foreground">Ata em processamento. Ela aparecerá aqui automaticamente.</CardContent></Card>;
  }

  if (minute.processing_status === "failed") {
    return <Card className="border-destructive/30"><CardContent className="p-4 text-sm text-destructive">Falha ao gerar ata: {minute.error_message || "tente subir a gravação manualmente."}</CardContent></Card>;
  }

  return (
    <Card className="border-success/30 bg-success/5">
      <CardHeader><CardTitle>Ata gerada</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div><p className="font-semibold text-foreground">Resumo executivo</p><p className="mt-1 whitespace-pre-line text-muted-foreground">{minute.executive_summary}</p></div>
        <div><p className="font-semibold text-foreground">Decisões</p>{decisions.length ? decisions.map((item, index) => <p key={index} className="text-muted-foreground">• {item.descricao} {item.responsavel ? `— ${item.responsavel}` : ""}</p>) : <p className="text-muted-foreground">Sem decisões registradas.</p>}</div>
        <div><p className="font-semibold text-foreground">Próximos passos</p>{actionItems.length ? actionItems.map((item, index) => <p key={index} className="text-muted-foreground">• {item.descricao} {item.responsavel ? `— ${item.responsavel}` : ""} {item.prazo ? `(${item.prazo})` : ""}</p>) : <p className="text-muted-foreground">Sem próximos passos.</p>}</div>
        <div><p className="font-semibold text-foreground">Pontos de atenção</p>{attentionPoints.length ? attentionPoints.map((item, index) => <p key={index} className="text-muted-foreground">• {item.descricao} <Badge variant="outline" className="ml-1 text-[10px]">{item.urgencia}</Badge></p>) : <p className="text-muted-foreground">Sem pontos críticos.</p>}</div>
        <Badge variant="secondary">Sentimento: {minute.sentiment || "neutro"}</Badge>
        {minute.transcript && <Collapsible><CollapsibleTrigger asChild><Button variant="outline" className="w-full gap-2">Ver transcript completo <ChevronDown className="h-4 w-4" /></Button></CollapsibleTrigger><CollapsibleContent className="mt-3 max-h-72 overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground whitespace-pre-line">{minute.transcript}</CollapsibleContent></Collapsible>}
      </CardContent>
    </Card>
  );
}
