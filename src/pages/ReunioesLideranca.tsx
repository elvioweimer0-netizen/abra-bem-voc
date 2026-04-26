import { useEffect, useMemo, useRef, useState } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  CalendarIcon,
  CheckCircle,
  ChevronDown,
  Clock,
  FileText,
  Frown,
  Lightbulb,
  Loader2,
  LogOut,
  Meh,
  Mic,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Smile,
  Sparkles,
  Upload,
  UserCircle,
  Users,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const db = supabase as any;

type Unit = { id: string; code: string; name: string };
type Meeting = {
  id: string;
  type: string;
  unit_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  title: string;
  minutes?: string | null;
  is_monthly_in_person?: boolean;
  ended_at?: string | null;
  created_at?: string;
  agenda?: any[];
};
type Occurrence = { id: string; descricao: string; gravidade: string; unit_id: string; criado_em: string };
type Notice = { id: string; titulo: string; created_at: string };
type MeetingMinute = { id: string; meeting_id: string; titulo?: string | null; executive_summary: string | null; decisions: any[]; action_items: any[]; attention_points: any[]; sentiment: string | null; transcript: string | null; processing_status: string; error_message: string | null; recording_url?: string | null; recording_file_path?: string | null };
type MeetingAttendee = { id: string; meeting_id: string; user_id: string; role_label: string | null; present: boolean; joined_at: string | null };
type AiSuggestion = { id: string; meeting_id: string; tipo: string; titulo: string; descricao: string; responsavel_sugerido: string | null; prazo_sugerido: string | null; beneficio_esperado: string; audiencia: string[]; status: string; aprovada_por?: string | null; aprovada_em?: string | null };
type ParticipantOption = { id: string; nome: string | null; cargo: string | null; foto_url: string | null; user_id: string | null; unit_id: string | null };
type PautaSuggestion = { id: string; suggested_by: string; suggested_at: string; target_meeting_type: string; unit_id: string | null; title: string; description: string; urgency: string; status: string; reviewed_by: string | null; reviewed_at: string | null; motivo_rejeicao: string | null; included_in_meeting_id: string | null };
type ProfileLite = { user_id: string; nome: string; cargo_titulo?: string | null; cargo?: string | null };

const meetingTypeLabels: Record<string, string> = { diaria: "Diária", semanal: "Semanal", individual: "Individual" };
const agendaTypeTone: Record<string, string> = {
  diaria: "border-primary/30 bg-primary/10 text-primary",
  semanal: "border-success/30 bg-success/10 text-success",
  individual: "border-accent bg-accent/70 text-accent-foreground",
  extra: "border-warning/30 bg-warning/10 text-warning",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function formatMeetingType(type: string) {
  return meetingTypeLabels[type] || "Extra";
}

function meetingTitle(meeting: Meeting, minute?: MeetingMinute) {
  const title = minute?.titulo || meeting.title;
  if (title?.trim()) return title.trim();
  return `Reunião ${formatMeetingType(meeting.type)} do dia ${format(parseISO(meeting.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}`;
}

function meetingDate(meeting: Meeting) {
  return new Date(`${meeting.scheduled_date}T${meeting.scheduled_time}`);
}

function formatDuration(meeting: Meeting) {
  const planned = Array.isArray(meeting.agenda) ? Number(meeting.agenda?.[0]?.duracao_minutos) : 0;
  if (!meeting.ended_at) return planned ? `${planned}min estimados` : "—";
  const minutes = Math.max(1, Math.round((new Date(meeting.ended_at).getTime() - meetingDate(meeting).getTime()) / 60000));
  if (!Number.isFinite(minutes)) return "—";
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}min` : `${minutes}min`;
}

function firstName(value?: string | null) {
  return (value || "Participante").split(" ")[0];
}

function minutesUntil(meeting: Meeting) {
  return Math.ceil((meetingDate(meeting).getTime() - Date.now()) / 60000);
}

export default function ReunioesLideranca() {
  const { user, profile } = useAuth();
  const role = profile?.cargo || "colaborador";
  const isAdminSupervisor = ["admin", "master", "supervisor"].includes(role);
  const canCreateMeeting = isAdminSupervisor;
  const canSuggestPauta = ["gerente", "gerente_loja", "gerente_adm"].includes(role);
  const isEncarregado = role === "encarregado";

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("agenda");
  const [units, setUnits] = useState<Unit[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [scheduledMeetings, setScheduledMeetings] = useState<Meeting[]>([]);
  const [historyMeetings, setHistoryMeetings] = useState<Meeting[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [attendees, setAttendees] = useState<MeetingAttendee[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [pautaSuggestions, setPautaSuggestions] = useState<PautaSuggestion[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [participantOptions, setParticipantOptions] = useState<ParticipantOption[]>([]);
  const [createMeetingOpen, setCreateMeetingOpen] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [selectedAgendaMeeting, setSelectedAgendaMeeting] = useState<Meeting | null>(null);
  const [retryingMinuteId, setRetryingMinuteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [joiningDaily, setJoiningDaily] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [processingRecording, setProcessingRecording] = useState(false);
  const [historyPeriod, setHistoryPeriod] = useState("30");
  const [historyType, setHistoryType] = useState("todos");
  const [historyUnit, setHistoryUnit] = useState("todos");
  const [calendarMode, setCalendarMode] = useState<"semana" | "mes">("semana");
  const [sale, setSale] = useState("");
  const [goal, setGoal] = useState("");
  const [freeAgenda, setFreeAgenda] = useState("");
  const [decisions, setDecisions] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("diaria");
  const [newDate, setNewDate] = useState<Date>(new Date());
  const [newTime, setNewTime] = useState("09:30");
  const [newDuration, setNewDuration] = useState("30");
  const [newUnit, setNewUnit] = useState("none");
  const [newParticipants, setNewParticipants] = useState<string[]>([]);
  const [newAgenda, setNewAgenda] = useState("");
  const [notifyParticipants, setNotifyParticipants] = useState(true);
  const [recordAndGenerate, setRecordAndGenerate] = useState(true);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [suggestTitle, setSuggestTitle] = useState("");
  const [suggestDescription, setSuggestDescription] = useState("");
  const [suggestType, setSuggestType] = useState("diaria");
  const [suggestUrgency, setSuggestUrgency] = useState("media");
  const [rejectionSuggestion, setRejectionSuggestion] = useState<PautaSuggestion | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingMeetingRef = useRef<Meeting | null>(null);
  const maxRecordingTimerRef = useRef<number | null>(null);
  const minuteStatusRef = useRef<Record<string, string>>({});

  const visibleByParticipation = (items: Meeting[]) => {
    if (!isEncarregado || !user) return items;
    const meetingIds = new Set(attendees.filter((attendee) => attendee.user_id === user.id).map((attendee) => attendee.meeting_id));
    return items.filter((meeting) => meetingIds.has(meeting.id));
  };

  const loadAll = async (notifyReady = false) => {
    const yesterday = yesterdayISO();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [unitRes, todayRes, scheduledRes, historyRes, boRes, noticeRes, minuteRes, attendeeRes, aiRes, teamRes, pautaRes, profileRes] = await Promise.all([
      db.from("units").select("id, code, name").eq("active", true).order("code"),
      db.from("leadership_meetings").select("id, type, unit_id, scheduled_date, scheduled_time, status, title, minutes, is_monthly_in_person, ended_at, created_at, agenda").eq("scheduled_date", todayISO()).order("scheduled_time"),
      db.from("leadership_meetings").select("id, type, unit_id, scheduled_date, scheduled_time, status, title, ended_at, created_at, agenda").eq("status", "agendada").gte("scheduled_date", todayISO()).order("scheduled_date").order("scheduled_time"),
      db.from("leadership_meetings").select("id, type, unit_id, scheduled_date, scheduled_time, status, title, ended_at, created_at, agenda").eq("status", "encerrada").order("ended_at", { ascending: false, nullsFirst: false }).limit(100),
      db.from("leadership_occurrences").select("id, descricao, gravidade, unit_id, criado_em").gte("criado_em", `${yesterday}T00:00:00`).lt("criado_em", `${todayISO()}T00:00:00`).in("gravidade", ["media", "alta"]),
      db.from("avisos").select("id, titulo, created_at").gte("created_at", since).eq("ativo", true).order("created_at", { ascending: false }),
      db.from("meeting_minutes").select("id, meeting_id, titulo, executive_summary, decisions, action_items, attention_points, sentiment, transcript, processing_status, error_message, recording_url, recording_file_path").order("created_at", { ascending: false }).limit(120),
      db.from("meeting_attendees").select("id, meeting_id, user_id, role_label, present, joined_at").order("joined_at", { ascending: true }),
      db.from("ai_suggestions").select("id, meeting_id, tipo, titulo, descricao, responsavel_sugerido, prazo_sugerido, beneficio_esperado, audiencia, status, aprovada_por, aprovada_em").order("created_at", { ascending: false }).limit(500),
      db.from("team_members").select("id, nome, cargo, foto_url, user_id, unit_id").eq("status", "ativo").order("nome"),
      db.from("meeting_pauta_suggestions").select("id, suggested_by, suggested_at, target_meeting_type, unit_id, title, description, urgency, status, reviewed_by, reviewed_at, motivo_rejeicao, included_in_meeting_id").order("suggested_at", { ascending: false }).limit(300),
      db.from("profiles").select("user_id, nome, cargo_titulo, cargo").limit(500),
    ]);

    const minuteData = minuteRes.data || [];
    if (notifyReady) {
      minuteData.forEach((minute: MeetingMinute) => {
        if (minute.processing_status === "completed" && minuteStatusRef.current[minute.meeting_id] && minuteStatusRef.current[minute.meeting_id] !== "completed") {
          toast.success("Nova ata pronta! Tocar para ver.", { action: { label: "Ver", onClick: () => setSelectedHistoryId(minute.meeting_id) } });
        }
      });
    }
    minuteStatusRef.current = Object.fromEntries(minuteData.map((minute: MeetingMinute) => [minute.meeting_id, minute.processing_status]));

    setUnits(unitRes.data || []);
    setMeetings(todayRes.data || []);
    setScheduledMeetings(scheduledRes.data || []);
    setHistoryMeetings(historyRes.data || []);
    setOccurrences(boRes.data || []);
    setNotices(noticeRes.data || []);
    setMinutes(minuteData);
    setAttendees(attendeeRes.data || []);
    setAiSuggestions(aiRes.data || []);
    setParticipantOptions(teamRes.data || []);
    setPautaSuggestions(pautaRes.data || []);
    setProfiles(profileRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const channel = db
      .channel("meeting-leadership-live")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "meeting_minutes" }, (payload: any) => {
        if (payload.new?.processing_status === "completed" && payload.old?.processing_status !== "completed") {
          loadAll(true);
          toast.success("Nova ata pronta! Tocar para ver.", { action: { label: "Ver", onClick: () => setSelectedHistoryId(payload.new.meeting_id) } });
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "meeting_pauta_suggestions" }, () => loadAll())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "meeting_pauta_suggestions" }, () => loadAll())
      .subscribe();
    const interval = window.setInterval(() => loadAll(true), 30000);
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
    };
  }, []);

  const dailyMeeting = meetings.find((m) => m.type === "diaria");
  const weeklyMeeting = meetings.find((m) => m.type === "semanal");
  const individualMeetings = visibleByParticipation(meetings.filter((m) => m.type === "individual"));
  const visibleScheduledMeetings = visibleByParticipation(scheduledMeetings);
  const visibleHistoryMeetings = visibleByParticipation(historyMeetings);
  const displayedPautaSuggestions = isAdminSupervisor || !user ? pautaSuggestions : pautaSuggestions.filter((suggestion) => suggestion.suggested_by === user.id);
  const pendingPautaCount = displayedPautaSuggestions.filter((suggestion) => suggestion.status === "pendente").length;
  const profileMap = useMemo(() => new Map(profiles.map((item) => [item.user_id, item])), [profiles]);
  const acceptedSuggestionsForDaily = pautaSuggestions.filter((suggestion) => suggestion.status === "aceita" && !suggestion.included_in_meeting_id && suggestion.target_meeting_type === "diaria");

  const activeMeeting = [...meetings, ...scheduledMeetings]
    .filter((meeting) => meeting.status === "em_andamento" || (meeting.status === "agendada" && minutesUntil(meeting) >= 0 && minutesUntil(meeting) <= 30))
    .sort((a, b) => meetingDate(a).getTime() - meetingDate(b).getTime())[0];

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: calendarMode === "semana" ? 7 : 14 }, (_, index) => addDays(start, index));
  }, [calendarMode]);

  const filteredHistoryMeetings = useMemo(() => visibleHistoryMeetings.filter((meeting) => {
    if (historyType !== "todos" && meeting.type !== historyType) return false;
    if (historyUnit !== "todos" && meeting.unit_id !== historyUnit) return false;
    if (historyPeriod === "todos") return true;
    const date = new Date(meeting.ended_at || meeting.created_at || `${meeting.scheduled_date}T${meeting.scheduled_time}`);
    const now = new Date();
    if (historyPeriod === "mes-passado") return date.getMonth() === now.getMonth() - 1 && date.getFullYear() === now.getFullYear();
    return date >= new Date(Date.now() - Number(historyPeriod) * 24 * 60 * 60 * 1000);
  }), [visibleHistoryMeetings, historyType, historyUnit, historyPeriod]);

  const weeklyStats = useMemo(() => units.map((unit, index) => ({ unit, percent: Math.max(45, 96 - index * 8) })), [units]);

  const attachAcceptedSuggestions = async (meeting: Meeting) => {
    const accepted = pautaSuggestions.filter((suggestion) => suggestion.status === "aceita" && !suggestion.included_in_meeting_id && suggestion.target_meeting_type === meeting.type && (!meeting.unit_id || !suggestion.unit_id || suggestion.unit_id === meeting.unit_id));
    if (!accepted.length) return [];
    const bonusItem = {
      tipo: "sugestoes_lideranca",
      title: "📌 Sugestões da liderança",
      items: accepted.map((suggestion) => ({ title: suggestion.title, description: suggestion.description, suggested_by: profileMap.get(suggestion.suggested_by)?.nome || "Gerente" })),
    };
    const currentAgenda = Array.isArray(meeting.agenda) ? meeting.agenda : [];
    await db.from("leadership_meetings").update({ agenda: [...currentAgenda, bonusItem] }).eq("id", meeting.id);
    await db.from("meeting_pauta_suggestions").update({ included_in_meeting_id: meeting.id }).in("id", accepted.map((suggestion) => suggestion.id));
    return accepted;
  };

  const ensureMeeting = async (type: "diaria" | "semanal", title: string) => {
    if (!user) return null;
    const existing = meetings.find((m) => m.type === type);
    if (existing) {
      await attachAcceptedSuggestions(existing);
      return existing;
    }
    const { data } = await db.from("leadership_meetings").insert({ type, title, scheduled_date: todayISO(), scheduled_time: "09:30", created_by: user.id }).select("id, type, unit_id, scheduled_date, scheduled_time, status, title, agenda").single();
    if (data) {
      await attachAcceptedSuggestions(data);
      setMeetings((current) => [...current, data]);
    }
    return data;
  };

  const startLocalRecording = async (meeting: Meeting) => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("Este navegador não suporta gravação local. Use o upload manual.");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
    const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => event.data.size > 0 && chunksRef.current.push(event.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    };
    recorderRef.current = recorder;
    streamRef.current = stream;
    recordingMeetingRef.current = meeting;
    recorder.start(1000);
    setIsRecording(true);
    maxRecordingTimerRef.current = window.setTimeout(() => stopRecordingAndProcess(), 90 * 60 * 1000);
  };

  const processRecordingBlob = async (meeting: Meeting, audioBlob: Blob) => {
    const path = `${meeting.id}/${Date.now()}-reuniao.webm`;
    const file = new File([audioBlob], "reuniao.webm", { type: audioBlob.type || "audio/webm" });
    const { error: uploadError } = await supabase.storage.from("meeting-recordings").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) throw uploadError;
    const { data: signed, error: signedError } = await supabase.storage.from("meeting-recordings").createSignedUrl(path, 60 * 60);
    if (signedError || !signed?.signedUrl) throw signedError || new Error("Não foi possível gerar URL da gravação.");
    const { data, error } = await supabase.functions.invoke("process-meeting-recording", { body: { meetingId: meeting.id, recording_url: signed.signedUrl, recording_file_path: path } });
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
      if (!recorder || recorder.state === "inactive") throw new Error("Nenhuma gravação ativa encontrada.");
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
      if (!audioBlob.size) throw new Error("A gravação ficou vazia.");
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
    try {
      const meeting = await ensureMeeting("diaria", "Reunião Diária");
      if (!meeting || !user) return;
      await startLocalRecording(meeting);
      const { data, error } = await supabase.functions.invoke("create-daily-room", { body: { meetingId: meeting.id, title: meeting.title, type: meeting.type } });
      if (error || !data?.url) throw new Error(error?.message || data?.error || "Não foi possível criar a sala.");
      await db.from("leadership_meetings").update({ status: "em_andamento" }).eq("id", meeting.id);
      await db.from("meeting_attendees").upsert({ meeting_id: meeting.id, user_id: user.id, role_label: profile?.cargo, present: true, joined_at: new Date().toISOString() }, { onConflict: "meeting_id,user_id" });
      toast.success("Sala iniciada", { description: "Gravação local ativa no navegador." });
      window.open(data.url, "_blank", "noopener,noreferrer");
      loadAll();
    } catch (error) {
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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-meeting-recording`, { method: "POST", headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, body: form });
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
    const text = [`ATA - ${meeting.title}`, `Participante: ${profile?.nome || "Usuário"}`, `B.O.s: ${occurrences.map((o) => o.descricao).join("; ") || "sem registros críticos"}`, `Informativos: ${notices.map((n) => n.titulo).join("; ") || "sem novos avisos"}`, `Venda anterior: ${sale || "não informada"}`, `Metas: ${goal || "não informadas"}`, `Decisões: ${decisions || "sem decisões registradas"}`].join("\n");
    await db.from("leadership_meetings").update({ status: "encerrada", minutes: text, decisions, ended_at: new Date().toISOString() }).eq("id", meeting.id);
    await db.from("notification_events").insert({ type: "meeting_minutes", title: "ATA disponível", body: `A ata de ${meeting.title} foi gerada.`, payload: { meeting_id: meeting.id } });
    toast.success("ATA gerada", { description: "Registro salvo e notificação preparada." });
    loadAll();
  };

  const generateWeekly = async () => {
    const meeting = await ensureMeeting("semanal", "Reunião Semanal");
    if (meeting) await closeMeeting(meeting);
  };

  const startScheduledMeeting = async (meeting: Meeting) => {
    await attachAcceptedSuggestions(meeting);
    await db.from("leadership_meetings").update({ status: "em_andamento" }).eq("id", meeting.id);
    toast.success("Reunião iniciada");
    loadAll();
  };

  const cancelScheduledMeeting = async (meeting: Meeting) => {
    await db.from("leadership_meetings").update({ status: "cancelada" }).eq("id", meeting.id);
    toast.success("Agendamento cancelado");
    loadAll();
  };

  const scheduleManualMeeting = async () => {
    if (!canCreateMeeting) return toast.error("Apenas admin e supervisor podem agendar reuniões.");
    if (!user || !newTitle.trim()) return toast.error("Informe o título da reunião");
    setSavingMeeting(true);
    try {
      const scheduledDate = format(newDate, "yyyy-MM-dd");
      const unitId = newUnit === "none" ? null : newUnit;
      const mappedType = newType === "semanal" ? "semanal" : newType === "individual" ? "individual" : "diaria";
      const { data: meeting, error } = await db.from("leadership_meetings").insert({ title: newTitle.trim(), type: mappedType, unit_id: unitId, scheduled_date: scheduledDate, scheduled_time: newTime, status: "agendada", created_by: user.id, agenda: [{ tipo: newType, duracao_minutos: Number(newDuration), pauta: newAgenda, gravar_gerar_ata: recordAndGenerate }] }).select("id, type, unit_id, scheduled_date, scheduled_time, status, title, ended_at, created_at, agenda").single();
      if (error) throw error;
      const selected = participantOptions.filter((item) => newParticipants.includes(item.id));
      if (selected.length) await db.from("meeting_attendees").insert(selected.map((item) => ({ meeting_id: meeting.id, user_id: item.user_id || user.id, role_label: item.nome || item.cargo || "Participante", present: false })));
      if (notifyParticipants) await db.from("notification_events").insert({ type: "meeting_reminder", unit_id: unitId, title: `Reunião agendada: ${newTitle.trim()}`, body: `${scheduledDate} às ${newTime}`, payload: { meeting_id: meeting.id, participant_ids: newParticipants } });
      setCreateMeetingOpen(false);
      setNewTitle("");
      setNewAgenda("");
      setNewParticipants([]);
      toast.success("Reunião agendada com sucesso ✅");
      setActiveTab("agenda");
      loadAll();
    } catch (error) {
      toast.error("Erro ao agendar reunião", { description: error instanceof Error ? error.message : "Tente novamente." });
    } finally {
      setSavingMeeting(false);
    }
  };

  const submitPautaSuggestion = async () => {
    if (!user || !canSuggestPauta) return;
    if (!suggestTitle.trim() || !suggestDescription.trim()) return toast.error("Preencha título e descrição.");
    try {
      const unitId = (profile as any)?.unit_id || null;
      await db.from("meeting_pauta_suggestions").insert({ suggested_by: user.id, target_meeting_type: suggestType, unit_id: unitId, title: suggestTitle.trim(), description: suggestDescription.trim().slice(0, 200), urgency: suggestUrgency, status: "pendente" });
      await db.from("notification_events").insert({ type: "meeting_reminder", unit_id: unitId, title: "💡 Nova sugestão de pauta", body: `${profile?.nome || "Gerente"}: ${suggestTitle.trim()}`, payload: { target_meeting_type: suggestType } });
      setSuggestionOpen(false);
      setSuggestTitle("");
      setSuggestDescription("");
      toast.success("Sugestão enviada para análise ✅");
      loadAll();
    } catch (error) {
      toast.error("Erro ao enviar sugestão", { description: error instanceof Error ? error.message : "Tente novamente." });
    }
  };

  const acceptPautaSuggestion = async (suggestion: PautaSuggestion) => {
    if (!isAdminSupervisor || !user) return;
    try {
      const nextMeeting = scheduledMeetings.find((meeting) => meeting.type === suggestion.target_meeting_type && (!suggestion.unit_id || !meeting.unit_id || meeting.unit_id === suggestion.unit_id));
      await db.from("meeting_pauta_suggestions").update({ status: "aceita", reviewed_by: user.id, reviewed_at: new Date().toISOString(), included_in_meeting_id: nextMeeting?.id || null }).eq("id", suggestion.id);
      if (nextMeeting) {
        const agenda = Array.isArray(nextMeeting.agenda) ? nextMeeting.agenda : [];
        await db.from("leadership_meetings").update({ agenda: [...agenda, { tipo: "sugestao_lideranca", title: suggestion.title, description: suggestion.description, suggested_by: suggestion.suggested_by }] }).eq("id", nextMeeting.id);
      }
      await db.from("notification_events").insert({ type: "meeting_reminder", recipient_user_id: suggestion.suggested_by, title: "Sugestão de pauta aceita", body: `Sua sugestão “${suggestion.title}” foi aceita.`, payload: { suggestion_id: suggestion.id, meeting_id: nextMeeting?.id || null } });
      toast.success(`Incluída na próxima ${formatMeetingType(suggestion.target_meeting_type)}`);
      loadAll();
    } catch (error) {
      toast.error("Erro ao aceitar sugestão", { description: error instanceof Error ? error.message : "Tente novamente." });
    }
  };

  const rejectPautaSuggestion = async () => {
    if (!rejectionSuggestion || !isAdminSupervisor || !user) return;
    await db.from("meeting_pauta_suggestions").update({ status: "rejeitada", reviewed_by: user.id, reviewed_at: new Date().toISOString(), motivo_rejeicao: rejectionReason || "Sem motivo informado" }).eq("id", rejectionSuggestion.id);
    await db.from("notification_events").insert({ type: "meeting_reminder", recipient_user_id: rejectionSuggestion.suggested_by, title: "Sugestão de pauta rejeitada", body: rejectionReason || "Sua sugestão foi analisada e não será incluída agora.", payload: { suggestion_id: rejectionSuggestion.id } });
    setRejectionSuggestion(null);
    setRejectionReason("");
    toast.success("Sugestão rejeitada");
    loadAll();
  };

  const retryMinute = async (minute: MeetingMinute) => {
    if (!minute.recording_url && !minute.recording_file_path) return toast.error("Sem gravação disponível", { description: "Suba a gravação manualmente para tentar novamente." });
    setRetryingMinuteId(minute.id);
    try {
      const { data, error } = await supabase.functions.invoke("process-meeting-recording", { body: { meetingId: minute.meeting_id, recording_url: minute.recording_url, recording_file_path: minute.recording_file_path } });
      if (error || data?.error) throw new Error(error?.message || data.error);
      toast.success("Processando ata... aguarde 2-3 min");
      await loadAll();
    } catch (error) {
      toast.error("Erro ao tentar novamente", { description: error instanceof Error ? error.message : "Não foi possível reprocessar a ata." });
    } finally {
      setRetryingMinuteId(null);
    }
  };

  const approveSuggestion = async (suggestion: AiSuggestion, changes?: Partial<AiSuggestion>) => {
    if (!isAdminSupervisor || !user) return;
    const finalSuggestion = { ...suggestion, ...changes };
    try {
      await db.from("meeting_action_items").insert({ meeting_id: finalSuggestion.meeting_id, descricao: finalSuggestion.descricao, responsavel: finalSuggestion.responsavel_sugerido, prazo: finalSuggestion.prazo_sugerido, status: "pendente" });
      await db.from("notification_events").insert({ type: "meeting_minutes", title: `Ação aprovada: ${finalSuggestion.titulo}`, body: finalSuggestion.descricao, payload: { meeting_id: finalSuggestion.meeting_id, suggestion_id: finalSuggestion.id, audiencia: finalSuggestion.audiencia } });
      await db.from("ai_suggestions").update({ ...changes, status: changes ? "editada" : "aprovada", aprovada_por: user.id, aprovada_em: new Date().toISOString() }).eq("id", suggestion.id);
      toast.success("Sugestão enviada para acompanhamento");
      await loadAll();
    } catch (error) {
      toast.error("Erro ao enviar sugestão", { description: error instanceof Error ? error.message : "Tente novamente." });
    }
  };

  const discardSuggestion = async (suggestion: AiSuggestion) => {
    if (!isAdminSupervisor || !user) return;
    await db.from("ai_suggestions").update({ status: "descartada", aprovada_por: user.id, aprovada_em: new Date().toISOString() }).eq("id", suggestion.id);
    toast.success("Sugestão descartada");
    await loadAll();
  };

  const leaveMeeting = async (meeting?: Meeting) => {
    if (!meeting || !user) return;
    await db.from("meeting_attendees").upsert({ meeting_id: meeting.id, user_id: user.id, role_label: profile?.cargo, present: false, joined_at: new Date().toISOString() }, { onConflict: "meeting_id,user_id" });
    toast.success("Você saiu da sala. A reunião continua ativa.");
    loadAll();
  };

  const selectedMeeting = historyMeetings.find((meeting) => meeting.id === selectedHistoryId);
  const selectedMinute = selectedMeeting ? minutes.find((minute) => minute.meeting_id === selectedMeeting.id) : undefined;
  const selectedAttendees = selectedMeeting ? attendees.filter((attendee) => attendee.meeting_id === selectedMeeting.id) : [];
  const selectedSuggestions = selectedMeeting ? aiSuggestions.filter((suggestion) => suggestion.meeting_id === selectedMeeting.id) : [];

  if (selectedMeeting) {
    return <MeetingMinuteDetail meeting={selectedMeeting} minute={selectedMinute} attendees={selectedAttendees} suggestions={selectedSuggestions} canReviewSuggestions={isAdminSupervisor} onApproveSuggestion={approveSuggestion} onDiscardSuggestion={discardSuggestion} onBack={() => setSelectedHistoryId(null)} onRefresh={() => loadAll()} onRetry={retryMinute} retrying={retryingMinuteId === selectedMinute?.id} />;
  }

  return (
    <div className="space-y-8 pb-24 animate-fade-in">
      <section className="overflow-hidden rounded-[1.25rem] gradient-curio p-6 text-primary-foreground shadow-lg sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary-foreground/80">Conecta Curió</p>
            <h1 className="mt-1 text-[28px] font-bold leading-tight sm:text-[32px]">Central de Reuniões</h1>
            <p className="mt-2 text-sm text-primary-foreground/85">Gestão de pautas, atas e agendamentos</p>
          </div>
          {canCreateMeeting && <Button className="min-h-14 rounded-2xl bg-card px-6 text-primary shadow-lg transition-transform duration-200 hover:scale-[1.02] hover:bg-card/95" onClick={() => setCreateMeetingOpen(true)}><Plus className="h-6 w-6" /> Nova Reunião</Button>}
          {canSuggestPauta && <Button variant="outline" className="min-h-14 rounded-2xl border-primary-foreground/45 bg-transparent px-6 text-primary-foreground transition-transform duration-200 hover:scale-[1.02] hover:bg-primary-foreground/10" onClick={() => setSuggestionOpen(true)}><Lightbulb className="h-6 w-6" /> Sugerir Pauta</Button>}
        </div>
      </section>

      {activeMeeting && <ActiveMeetingBanner meeting={activeMeeting} onEnter={() => activeMeeting.status === "agendada" ? startScheduledMeeting(activeMeeting) : joinDaily()} />}

      {loading ? <PageSkeleton /> : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-[1.25rem] bg-accent/40 p-1.5 shadow-sm">
            <ProTab value="agenda" icon={<CalendarDays className="h-5 w-5" />} label="Agenda" />
            <ProTab value="historico" icon={<FileText className="h-5 w-5" />} label="Histórico" />
            <TabsTrigger value="sugestoes" className="relative min-h-14 rounded-2xl text-xs font-semibold transition-all data-[state=active]:bg-card data-[state=active]:shadow-lg sm:text-sm"><Lightbulb className="mr-1 h-5 w-5" /> Sugestões{pendingPautaCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-destructive px-2 py-0.5 text-[10px] text-destructive-foreground">{pendingPautaCount}</span>}</TabsTrigger>
          </TabsList>

          <TabsContent value="agenda" className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-4 after:h-px after:flex-1 after:bg-gradient-to-r after:from-primary/30 after:to-transparent">
              <div><h2 className="text-xl font-bold text-foreground">Agenda</h2><p className="text-sm text-muted-foreground">Hoje e próximas reuniões programadas</p></div>
              <div className="flex gap-2"><Button variant={calendarMode === "semana" ? "default" : "outline"} size="sm" onClick={() => setCalendarMode("semana")}>Semana</Button><Button variant={calendarMode === "mes" ? "default" : "outline"} size="sm" onClick={() => setCalendarMode("mes")}>Mês</Button></div>
            </div>
            <AgendaTimeline days={weekDays} meetings={visibleScheduledMeetings} attendees={attendees} onOpen={setSelectedAgendaMeeting} />
            <TodaySection meetings={visibleByParticipation(meetings.filter((meeting) => meeting.status !== "encerrada"))} dailyMeeting={dailyMeeting} dailyMinute={undefined} isRecording={isRecording} joiningDaily={joiningDaily} uploading={uploading} processingRecording={processingRecording} occurrences={occurrences} notices={notices} sale={sale} setSale={setSale} goal={goal} setGoal={setGoal} decisions={decisions} setDecisions={setDecisions} acceptedSuggestions={acceptedSuggestionsForDaily} profiles={profileMap} canEndMeeting={isAdminSupervisor} onJoin={joinDaily} onUpload={uploadManualRecording} onCloseDaily={() => isRecording ? stopRecordingAndProcess() : closeMeeting(dailyMeeting)} onCloseMeeting={closeMeeting} onLeaveMeeting={leaveMeeting} />
            {canCreateMeeting && <Button className="fixed bottom-24 right-5 z-20 h-14 w-14 rounded-full shadow-xl transition-transform hover:scale-105 sm:hidden" size="icon" onClick={() => setCreateMeetingOpen(true)}><Plus className="h-7 w-7" /></Button>}
          </TabsContent>

          <TabsContent value="historico" className="animate-fade-in space-y-5">
            <HistoryFilters historyPeriod={historyPeriod} setHistoryPeriod={setHistoryPeriod} historyType={historyType} setHistoryType={setHistoryType} historyUnit={historyUnit} setHistoryUnit={setHistoryUnit} units={units} canChooseUnit={isAdminSupervisor} onRefresh={() => loadAll()} />
            {filteredHistoryMeetings.map((meeting) => <HistoryMeetingCard key={meeting.id} meeting={meeting} minute={minutes.find((item) => item.meeting_id === meeting.id)} attendees={attendees.filter((item) => item.meeting_id === meeting.id)} pendingSuggestions={aiSuggestions.filter((item) => item.meeting_id === meeting.id && item.status === "pendente").length} onOpen={() => setSelectedHistoryId(meeting.id)} onRefresh={() => loadAll()} onRetry={retryMinute} retrying={retryingMinuteId === minutes.find((item) => item.meeting_id === meeting.id)?.id} />)}
            {!filteredHistoryMeetings.length && <EmptyState title="Nenhuma ata por aqui" description="O Curió vai organizar as atas assim que as reuniões forem encerradas." />}
          </TabsContent>

          <TabsContent value="sugestoes" className="animate-fade-in space-y-5">
            <PautaSuggestionsSection suggestions={displayedPautaSuggestions} profiles={profileMap} canReview={isAdminSupervisor} onAccept={acceptPautaSuggestion} onReject={(suggestion) => setRejectionSuggestion(suggestion)} />
          </TabsContent>
        </Tabs>
      )}

      {canCreateMeeting && <CreateMeetingDialog open={createMeetingOpen} onOpenChange={setCreateMeetingOpen} title={newTitle} setTitle={setNewTitle} type={newType} setType={setNewType} date={newDate} setDate={setNewDate} time={newTime} setTime={setNewTime} duration={newDuration} setDuration={setNewDuration} unit={newUnit} setUnit={setNewUnit} units={units} canChooseUnit={isAdminSupervisor} participants={participantOptions} selectedParticipants={newParticipants} setSelectedParticipants={setNewParticipants} agenda={newAgenda} setAgenda={setNewAgenda} notify={notifyParticipants} setNotify={setNotifyParticipants} record={recordAndGenerate} setRecord={setRecordAndGenerate} saving={savingMeeting} onSave={scheduleManualMeeting} />}
      {canSuggestPauta && <PautaSuggestionDialog open={suggestionOpen} onOpenChange={setSuggestionOpen} title={suggestTitle} setTitle={setSuggestTitle} description={suggestDescription} setDescription={setSuggestDescription} type={suggestType} setType={setSuggestType} urgency={suggestUrgency} setUrgency={setSuggestUrgency} onSubmit={submitPautaSuggestion} />}
      <AgendaMeetingDialog meeting={selectedAgendaMeeting} attendees={attendees.filter((item) => item.meeting_id === selectedAgendaMeeting?.id)} canManage={isAdminSupervisor} onOpenChange={(open) => !open && setSelectedAgendaMeeting(null)} onStart={startScheduledMeeting} onCancel={cancelScheduledMeeting} />
      <RejectSuggestionDialog suggestion={rejectionSuggestion} reason={rejectionReason} setReason={setRejectionReason} onOpenChange={(open) => !open && setRejectionSuggestion(null)} onConfirm={rejectPautaSuggestion} />
    </div>
  );
}

function ProTab({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) {
  return <TabsTrigger value={value} className="min-h-14 rounded-2xl text-xs font-semibold transition-all data-[state=active]:bg-card data-[state=active]:shadow-lg sm:text-sm">{icon}<span className="ml-1 hidden sm:inline">{label}</span><span className="ml-1 sm:hidden">{label}</span></TabsTrigger>;
}

function ActiveMeetingBanner({ meeting, onEnter }: { meeting: Meeting; onEnter: () => void }) {
  const minutes = minutesUntil(meeting);
  const now = meeting.status === "em_andamento" || minutes <= 0;
  return <Card className="overflow-hidden rounded-[1.25rem] border-primary/30 gradient-curio text-primary-foreground shadow-xl animate-pulse"><CardContent className="p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold tracking-wide">{now ? "🔴 REUNIÃO AGORA" : `⏰ Próxima reunião em ${minutes} minutos`}</p><h2 className="mt-1 text-xl font-bold">{meeting.title}</h2><p className="text-sm text-primary-foreground/80">{format(meetingDate(meeting), "dd/MM 'às' HH:mm", { locale: ptBR })}</p></div><Button className="min-h-13 rounded-2xl bg-card text-primary hover:bg-card/95" onClick={onEnter}>Entrar agora</Button></div></CardContent></Card>;
}

function PageSkeleton() {
  return <div className="space-y-5">{Array.from({ length: 4 }).map((_, index) => <Card key={index} className="rounded-[1.25rem]"><CardContent className="space-y-3 p-5"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-24 w-full rounded-2xl" /></CardContent></Card>)}</div>;
}

function AgendaTimeline({ days, meetings, attendees, onOpen }: { days: Date[]; meetings: Meeting[]; attendees: MeetingAttendee[]; onOpen: (meeting: Meeting) => void }) {
  return <div className="grid gap-4 lg:grid-cols-7">{days.map((day) => { const dayMeetings = meetings.filter((meeting) => isSameDay(parseISO(meeting.scheduled_date), day)); return <section key={day.toISOString()} className="min-h-44 rounded-[1.25rem] border border-border bg-card p-4 shadow-lg transition-all duration-200 hover:shadow-xl"><div className="mb-4"><p className="text-sm font-bold text-foreground">{format(day, "EEE", { locale: ptBR })}</p><p className="text-xs text-muted-foreground">{format(day, "dd/MM")}</p></div><div className="space-y-3">{dayMeetings.map((meeting) => <button key={meeting.id} type="button" onClick={() => onOpen(meeting)} className={cn("w-full rounded-2xl border p-3 text-left shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg", agendaTypeTone[meeting.type] || agendaTypeTone.extra)}><p className="text-xs font-semibold">{meeting.scheduled_time.slice(0, 5)} · {formatMeetingType(meeting.type)}</p><h3 className="mt-1 line-clamp-2 text-sm font-bold">{meeting.title}</h3><p className="mt-2 text-xs opacity-80">{attendees.filter((item) => item.meeting_id === meeting.id).length || 1} participante(s)</p></button>)}{!dayMeetings.length && <p className="rounded-2xl bg-accent/40 p-3 text-xs text-muted-foreground">Sem reuniões</p>}</div></section>; })}</div>;
}

function TodaySection(props: { meetings: Meeting[]; dailyMeeting?: Meeting; dailyMinute?: MeetingMinute; isRecording: boolean; joiningDaily: boolean; uploading: boolean; processingRecording: boolean; occurrences: Occurrence[]; notices: Notice[]; sale: string; setSale: (value: string) => void; goal: string; setGoal: (value: string) => void; decisions: string; setDecisions: (value: string) => void; acceptedSuggestions: PautaSuggestion[]; profiles: Map<string, ProfileLite>; canEndMeeting: boolean; onJoin: () => void; onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void; onCloseDaily: () => void; onCloseMeeting: (meeting?: Meeting) => void; onLeaveMeeting: (meeting?: Meeting) => void }) {
  const otherMeetings = props.meetings.filter((meeting) => meeting.id !== props.dailyMeeting?.id);
  return <div className="space-y-6"><Card className="rounded-[1.25rem] border-primary/30 bg-primary/10 shadow-lg"><CardContent className="p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold text-foreground">Reunião imediata</h2><p className="mt-1 text-sm text-muted-foreground">Diária operacional · 09:30</p></div><Mic className="h-8 w-8 text-primary" /></div>{props.isRecording && <Badge className="mt-4 bg-destructive text-destructive-foreground">🔴 Gravando</Badge>}<Button className="mt-5 min-h-14 w-full rounded-2xl gap-2 shadow-lg" onClick={props.onJoin} disabled={props.joiningDaily}><Mic className="h-5 w-5" /> {props.joiningDaily ? "Iniciando..." : "Entrar/Iniciar"}</Button><Input id="manual-recording" type="file" accept="audio/*,video/*" className="hidden" onChange={props.onUpload} disabled={props.uploading || !props.dailyMeeting} />{props.canEndMeeting && <Button variant="outline" className="mt-3 min-h-12 w-full rounded-2xl gap-2 bg-card" asChild disabled={props.uploading || !props.dailyMeeting}><label htmlFor="manual-recording"><Upload className="h-5 w-5" /> {props.uploading ? "Processando..." : "Subir gravação manual"}</label></Button>}</CardContent></Card><Card className="rounded-[1.25rem] shadow-lg"><CardHeader><CardTitle>Pauta automática</CardTitle></CardHeader><CardContent className="space-y-5"><AgendaBlock title="1. B.O. do dia anterior" items={props.occurrences.map((o) => o.descricao)} empty="Sem B.O.s médios/altos ontem." /><AgendaBlock title="2. Informativos novos" items={props.notices.map((n) => n.titulo)} empty="Sem avisos nas últimas 24h." />{props.acceptedSuggestions.length > 0 && <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4"><p className="font-bold text-foreground">📌 Sugestões da liderança</p>{props.acceptedSuggestions.map((suggestion) => <p key={suggestion.id} className="mt-2 text-sm text-muted-foreground">• {suggestion.title} — {props.profiles.get(suggestion.suggested_by)?.nome || "Gerente"}</p>)}</div>}<Input placeholder="3. Venda do dia anterior por loja" value={props.sale} onChange={(e) => props.setSale(e.target.value)} /><Input placeholder="4. Metas do dia por loja" value={props.goal} onChange={(e) => props.setGoal(e.target.value)} /><Textarea placeholder="Decisões tomadas" value={props.decisions} onChange={(e) => props.setDecisions(e.target.value)} />{props.canEndMeeting ? <Button variant="outline" className="min-h-12 w-full rounded-2xl gap-2" onClick={props.onCloseDaily} disabled={props.processingRecording}><FileText className="h-5 w-5" /> {props.processingRecording ? "Processando..." : "Encerrar reunião e gerar ATA"}</Button> : <Button variant="outline" className="min-h-12 w-full rounded-2xl gap-2 bg-card" onClick={() => props.onLeaveMeeting(props.dailyMeeting)}><LogOut className="h-5 w-5" /> 🚪 Sair da sala</Button>}</CardContent></Card><div className="grid gap-4 sm:grid-cols-2">{otherMeetings.map((meeting) => <Card key={meeting.id} className="rounded-[1.25rem] shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"><CardContent className="p-5"><Badge variant="secondary">{formatMeetingType(meeting.type)}</Badge><h3 className="mt-3 text-lg font-bold text-foreground">{meeting.title}</h3><p className="text-sm text-muted-foreground">{meeting.scheduled_time.slice(0, 5)} · {meeting.is_monthly_in_person ? "Presencial" : "Online"}</p>{props.canEndMeeting ? <Button className="mt-4 w-full rounded-2xl" onClick={() => props.onCloseMeeting(meeting)}>Encerrar e gerar ATA</Button> : <Button variant="outline" className="mt-4 w-full rounded-2xl gap-2 bg-card" onClick={() => props.onLeaveMeeting(meeting)}><LogOut className="h-4 w-4" /> Sair da sala</Button>}</CardContent></Card>)}</div></div>;
}

function AgendaBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div><p className="font-bold text-foreground">{title}</p>{items.length ? items.map((item, index) => <p key={index} className="mt-1 text-sm text-muted-foreground">• {item}</p>) : <p className="mt-1 text-sm text-muted-foreground">{empty}</p>}</div>;
}

function HistoryFilters({ historyPeriod, setHistoryPeriod, historyType, setHistoryType, historyUnit, setHistoryUnit, units, canChooseUnit, onRefresh }: { historyPeriod: string; setHistoryPeriod: (value: string) => void; historyType: string; setHistoryType: (value: string) => void; historyUnit: string; setHistoryUnit: (value: string) => void; units: Unit[]; canChooseUnit: boolean; onRefresh: () => void }) {
  return <div className="grid gap-3 rounded-[1.25rem] bg-card p-4 shadow-lg sm:grid-cols-4"><Select value={historyPeriod} onValueChange={setHistoryPeriod}><SelectTrigger className="rounded-2xl"><SelectValue placeholder="Período" /></SelectTrigger><SelectContent><SelectItem value="7">Últimos 7 dias</SelectItem><SelectItem value="30">Últimos 30 dias</SelectItem><SelectItem value="mes-passado">Mês passado</SelectItem><SelectItem value="todos">Todos</SelectItem></SelectContent></Select><Select value={historyType} onValueChange={setHistoryType}><SelectTrigger className="rounded-2xl"><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="diaria">Diária</SelectItem><SelectItem value="semanal">Semanal</SelectItem><SelectItem value="individual">Individual</SelectItem></SelectContent></Select><Select value={historyUnit} onValueChange={setHistoryUnit} disabled={!canChooseUnit}><SelectTrigger className="rounded-2xl"><SelectValue placeholder="Unidade" /></SelectTrigger><SelectContent><SelectItem value="todos">Todas</SelectItem>{units.map((unit) => <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>)}</SelectContent></Select><Button variant="outline" className="rounded-2xl gap-2" onClick={onRefresh}><RefreshCw className="h-4 w-4" /> Atualizar</Button></div>;
}

function MinutesCard({ minute }: { minute: MeetingMinute }) {
  if (minute.processing_status === "processing" || minute.processing_status === "pending") return <Card className="rounded-[1.25rem] shadow-lg"><CardContent className="p-5 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Ata em processamento.</CardContent></Card>;
  if (minute.processing_status === "failed") return <Card className="rounded-[1.25rem] border-destructive/30 shadow-lg"><CardContent className="p-5 text-sm text-destructive">Falha ao gerar ata: {minute.error_message || "tente subir a gravação manualmente."}</CardContent></Card>;
  return <Card className="rounded-[1.25rem] border-success/30 bg-success/5 shadow-lg"><CardHeader><CardTitle>Ata gerada</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div><p className="font-semibold text-foreground">Resumo executivo</p><p className="mt-1 whitespace-pre-line text-muted-foreground">{minute.executive_summary}</p></div><Badge variant="secondary">Sentimento: {minute.sentiment || "neutro"}</Badge></CardContent></Card>;
}

function minuteStatus(minute?: MeetingMinute) {
  if (!minute || minute.processing_status === "pending" || minute.processing_status === "processing") return { label: "⏳ PROCESSANDO", className: "bg-warning/15 text-warning border-warning/25" };
  if (minute.processing_status === "failed") return { label: "❌ ERRO", className: "bg-destructive/15 text-destructive border-destructive/25" };
  return { label: "✅ ATA PRONTA", className: "bg-success/15 text-success border-success/25" };
}

function HistoryMeetingCard({ meeting, minute, attendees, pendingSuggestions, onOpen, onRefresh, onRetry, retrying }: { meeting: Meeting; minute?: MeetingMinute; attendees: MeetingAttendee[]; pendingSuggestions: number; onOpen: () => void; onRefresh: () => void; onRetry: (minute: MeetingMinute) => void; retrying: boolean }) {
  const status = minuteStatus(minute);
  const sentiment = minute?.sentiment || "neutro";
  const sentimentTone = sentiment === "positivo" ? "bg-success/10 text-success" : sentiment === "tenso" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground";
  return <Card className="rounded-[1.25rem] bg-card shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"><CardContent className="p-5"><button type="button" className="w-full text-left" onClick={onOpen}><div className="space-y-4"><p className="text-center text-sm text-muted-foreground">📅 {meetingDate(meeting).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p><h3 className="text-center text-[19px] font-bold leading-snug text-primary">📝 {meetingTitle(meeting, minute)}</h3><div className="mx-auto h-px max-w-sm bg-gradient-to-r from-transparent via-primary/30 to-transparent" /><div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground"><span>🏷️ {formatMeetingType(meeting.type)}</span><span>⏱️ {formatDuration(meeting)}</span><span>👥 {attendees.length || 1} participantes</span></div><div className="flex items-center justify-center gap-1">{(attendees.length ? attendees : [{ id: "fallback", role_label: "Participante" } as MeetingAttendee]).slice(0, 6).map((attendee, index) => <div key={attendee.id} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-accent text-xs font-bold text-accent-foreground shadow-sm" style={{ marginLeft: index ? -10 : 0 }}>{firstName(attendee.role_label).slice(0, 1)}</div>)}</div><div className="flex flex-wrap items-center justify-center gap-2"><Badge variant="outline" className={status.className}>{status.label}</Badge><Badge className={sentimentTone}>{sentiment === "positivo" ? "🙂" : sentiment === "tenso" ? "😟" : "😐"} {sentiment}</Badge>{pendingSuggestions > 0 && <Badge variant="destructive">🤖 {pendingSuggestions} sugestões pendentes</Badge>}</div></div></button>{(!minute || minute.processing_status === "pending" || minute.processing_status === "processing" || minute.processing_status === "failed") && <Button variant="outline" className="mt-4 min-h-11 w-full rounded-2xl gap-2" onClick={minute?.processing_status === "failed" && minute ? () => onRetry(minute) : onRefresh} disabled={retrying}><RefreshCw className="h-4 w-4" /> {minute?.processing_status === "failed" ? (retrying ? "Tentando..." : "Tentar novamente") : "Atualizar"}</Button>}</CardContent></Card>;
}

function PautaSuggestionsSection({ suggestions, profiles, canReview, onAccept, onReject }: { suggestions: PautaSuggestion[]; profiles: Map<string, ProfileLite>; canReview: boolean; onAccept: (suggestion: PautaSuggestion) => void; onReject: (suggestion: PautaSuggestion) => void }) {
  if (!suggestions.length) return <EmptyState title="Sem sugestões de pauta" description="Quando os gerentes enviarem ideias, elas aparecerão aqui para análise." />;
  return <div className="space-y-4">{suggestions.map((suggestion) => <Card key={suggestion.id} className="rounded-[1.25rem] shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-muted-foreground">{profiles.get(suggestion.suggested_by)?.nome || "Gerente"} · {new Date(suggestion.suggested_at).toLocaleDateString("pt-BR")}</p><h3 className="mt-2 text-lg font-bold text-foreground">{suggestion.title}</h3><p className="mt-2 text-sm text-muted-foreground">{suggestion.description}</p></div><Badge variant={suggestion.status === "pendente" ? "destructive" : suggestion.status === "aceita" ? "default" : "secondary"}>{suggestion.status}</Badge></div><div className="mt-4 flex flex-wrap gap-2"><Badge variant="outline">{formatMeetingType(suggestion.target_meeting_type)}</Badge><Badge variant="outline">Urgência {suggestion.urgency}</Badge></div>{canReview && suggestion.status === "pendente" && <div className="mt-4 grid gap-2 sm:grid-cols-2"><Button className="rounded-2xl gap-2" onClick={() => onAccept(suggestion)}><CheckCircle className="h-4 w-4" /> Incluir na próxima {formatMeetingType(suggestion.target_meeting_type)}</Button><Button variant="outline" className="rounded-2xl gap-2 bg-card" onClick={() => onReject(suggestion)}><XCircle className="h-4 w-4" /> Rejeitar</Button></div>}{suggestion.motivo_rejeicao && <p className="mt-3 rounded-2xl bg-muted p-3 text-sm text-muted-foreground">Motivo: {suggestion.motivo_rejeicao}</p>}</CardContent></Card>)}</div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <Card className="rounded-[1.25rem] border-dashed shadow-lg"><CardContent className="flex flex-col items-center p-8 text-center"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl">🐦</div><h3 className="mt-4 text-xl font-bold text-foreground">{title}</h3><p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p></CardContent></Card>;
}

function CreateMeetingDialog({ open, onOpenChange, title, setTitle, type, setType, date, setDate, time, setTime, duration, setDuration, unit, setUnit, units, canChooseUnit, participants, selectedParticipants, setSelectedParticipants, agenda, setAgenda, notify, setNotify, record, setRecord, saving, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; setTitle: (value: string) => void; type: string; setType: (value: string) => void; date: Date; setDate: (value: Date) => void; time: string; setTime: (value: string) => void; duration: string; setDuration: (value: string) => void; unit: string; setUnit: (value: string) => void; units: Unit[]; canChooseUnit: boolean; participants: ParticipantOption[]; selectedParticipants: string[]; setSelectedParticipants: (value: string[]) => void; agenda: string; setAgenda: (value: string) => void; notify: boolean; setNotify: (value: boolean) => void; record: boolean; setRecord: (value: boolean) => void; saving: boolean; onSave: () => void }) {
  const toggleParticipant = (id: string) => setSelectedParticipants(selectedParticipants.includes(id) ? selectedParticipants.filter((item) => item !== id) : [...selectedParticipants, id]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-[1.25rem]"><DialogHeader><DialogTitle>Nova Reunião</DialogTitle></DialogHeader><div className="space-y-4"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da reunião" /><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="diaria">Diária Extra</SelectItem><SelectItem value="semanal">Semanal Extra</SelectItem><SelectItem value="individual">Individual</SelectItem><SelectItem value="treinamento">Treinamento</SelectItem><SelectItem value="emergencia">Emergência</SelectItem><SelectItem value="outra">Outra</SelectItem></SelectContent></Select><div className="grid gap-2 sm:grid-cols-2"><Popover><PopoverTrigger asChild><Button variant="outline" className="justify-start bg-card text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" /> {format(date, "dd/MM/yyyy")}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={date} onSelect={(value) => value && setDate(value)} initialFocus /></PopoverContent></Popover><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div><Select value={duration} onValueChange={setDuration}><SelectTrigger><SelectValue placeholder="Duração" /></SelectTrigger><SelectContent><SelectItem value="15">15min</SelectItem><SelectItem value="30">30min</SelectItem><SelectItem value="45">45min</SelectItem><SelectItem value="60">1h</SelectItem><SelectItem value="90">1h30</SelectItem><SelectItem value="120">2h</SelectItem></SelectContent></Select><Select value={unit} onValueChange={setUnit} disabled={!canChooseUnit}><SelectTrigger><SelectValue placeholder="Unidade" /></SelectTrigger><SelectContent><SelectItem value="none">Sem unidade</SelectItem>{units.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select><div className="space-y-2"><p className="text-sm font-semibold text-foreground">Participantes</p><div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-border p-2">{participants.map((participant) => <button key={participant.id} type="button" onClick={() => toggleParticipant(participant.id)} className={cn("flex w-full items-center gap-3 rounded-2xl p-2 text-left text-sm transition-colors", selectedParticipants.includes(participant.id) ? "bg-primary/10 text-primary" : "hover:bg-muted")}><UserCircle className="h-6 w-6" /><span className="flex-1"><strong>{participant.nome || "Sem nome"}</strong><br /><span className="text-xs text-muted-foreground">{participant.cargo || "Cargo não informado"}</span></span>{selectedParticipants.includes(participant.id) && <CheckCircle className="h-4 w-4" />}</button>)}</div></div><Textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} placeholder="Pauta inicial (opcional)" /><ToggleRow label="Avisar participantes" checked={notify} onChange={setNotify} /><ToggleRow label="Gravar e gerar ata" checked={record} onChange={setRecord} /><Button className="w-full rounded-2xl" onClick={onSave} disabled={saving}>{saving ? "Agendando..." : "Agendar reunião"}</Button></div></DialogContent></Dialog>;
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-2xl border border-border p-3"><span className="text-sm">{label}</span><Switch checked={checked} onCheckedChange={onChange} /></div>;
}

function PautaSuggestionDialog({ open, onOpenChange, title, setTitle, description, setDescription, type, setType, urgency, setUrgency, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; setTitle: (value: string) => void; description: string; setDescription: (value: string) => void; type: string; setType: (value: string) => void; urgency: string; setUrgency: (value: string) => void; onSubmit: () => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="rounded-[1.25rem]"><DialogHeader><DialogTitle>💡 Sugerir pauta</DialogTitle></DialogHeader><div className="space-y-4"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título curto" maxLength={80} /><Textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 200))} placeholder="Descrição da sugestão" /><p className="text-right text-xs text-muted-foreground">{description.length}/200</p><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue placeholder="Tipo de reunião" /></SelectTrigger><SelectContent><SelectItem value="diaria">Diária</SelectItem><SelectItem value="semanal">Semanal</SelectItem><SelectItem value="individual">Individual</SelectItem></SelectContent></Select><Select value={urgency} onValueChange={setUrgency}><SelectTrigger><SelectValue placeholder="Urgência" /></SelectTrigger><SelectContent><SelectItem value="baixa">Baixa</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="alta">Alta</SelectItem></SelectContent></Select><Button className="w-full rounded-2xl gap-2" onClick={onSubmit}><Send className="h-4 w-4" /> Enviar sugestão</Button></div></DialogContent></Dialog>;
}

function AgendaMeetingDialog({ meeting, attendees, canManage, onOpenChange, onStart, onCancel }: { meeting: Meeting | null; attendees: MeetingAttendee[]; canManage: boolean; onOpenChange: (open: boolean) => void; onStart: (meeting: Meeting) => void; onCancel: (meeting: Meeting) => void }) {
  return <Dialog open={!!meeting} onOpenChange={onOpenChange}><DialogContent className="rounded-[1.25rem]"><DialogHeader><DialogTitle>{meeting?.title}</DialogTitle></DialogHeader>{meeting && <div className="space-y-4"><p className="text-sm text-muted-foreground">{formatMeetingType(meeting.type)} · {meetingDate(meeting).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p><div className="flex flex-wrap gap-2">{attendees.map((attendee) => <Badge key={attendee.id} variant="outline"><UserCircle className="mr-1 h-3 w-3" />{firstName(attendee.role_label)}</Badge>)}</div><Button className="w-full rounded-2xl" onClick={() => onStart(meeting)}>Entrar</Button>{canManage && <div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" className="rounded-2xl bg-card">Editar</Button><Button variant="outline" className="rounded-2xl bg-card" onClick={() => onCancel(meeting)}>Cancelar</Button></div>}</div>}</DialogContent></Dialog>;
}

function RejectSuggestionDialog({ suggestion, reason, setReason, onOpenChange, onConfirm }: { suggestion: PautaSuggestion | null; reason: string; setReason: (value: string) => void; onOpenChange: (open: boolean) => void; onConfirm: () => void }) {
  return <Dialog open={!!suggestion} onOpenChange={onOpenChange}><DialogContent className="rounded-[1.25rem]"><DialogHeader><DialogTitle>Rejeitar sugestão</DialogTitle></DialogHeader><div className="space-y-4"><p className="text-sm text-muted-foreground">Informe o motivo para o gerente.</p><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo da rejeição" /><Button variant="destructive" className="w-full rounded-2xl" onClick={onConfirm}>Confirmar rejeição</Button></div></DialogContent></Dialog>;
}

function MeetingMinuteDetail({ meeting, minute, attendees, suggestions, canReviewSuggestions, onApproveSuggestion, onDiscardSuggestion, onBack, onRefresh, onRetry, retrying }: { meeting: Meeting; minute?: MeetingMinute; attendees: MeetingAttendee[]; suggestions: AiSuggestion[]; canReviewSuggestions: boolean; onApproveSuggestion: (suggestion: AiSuggestion, changes?: Partial<AiSuggestion>) => void; onDiscardSuggestion: (suggestion: AiSuggestion) => void; onBack: () => void; onRefresh: () => void; onRetry: (minute: MeetingMinute) => void; retrying: boolean }) {
  const decisions = Array.isArray(minute?.decisions) ? minute.decisions : [];
  const actionItems = Array.isArray(minute?.action_items) ? minute.action_items : [];
  const attentionPoints = Array.isArray(minute?.attention_points) ? minute.attention_points : [];
  const status = minuteStatus(minute);
  const sentiment = minute?.sentiment || "neutro";
  const SentimentIcon = sentiment === "positivo" ? Smile : sentiment === "tenso" ? Frown : Meh;
  const pendingSuggestions = suggestions.filter((suggestion) => suggestion.status === "pendente");
  return <div className="space-y-6 animate-fade-in"><Button variant="ghost" className="gap-2 px-0" onClick={onBack}><ArrowLeft className="h-5 w-5" /> Voltar</Button><section className="rounded-[1.25rem] gradient-curio p-6 text-primary-foreground shadow-xl"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-primary-foreground/80">{formatMeetingType(meeting.type)}</p><h1 className="mt-1 text-[28px] font-bold leading-tight">{minute?.titulo || meeting.title || "Ata da reunião"}</h1></div><Badge variant={status.tone}>{status.label}</Badge></div><div className="mt-4 grid gap-2 text-sm text-primary-foreground/85 sm:grid-cols-3"><span>{meetingDate(meeting).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span><span>Duração: {formatDuration(meeting)}</span><span className="flex items-center gap-1"><Users className="h-4 w-4" /> {attendees.length || 1} participante(s)</span></div></section>{(!minute || minute.processing_status === "pending" || minute.processing_status === "processing") && <Card className="rounded-[1.25rem] shadow-lg"><CardContent className="space-y-3 p-5 text-sm text-muted-foreground"><p>A ata ainda está em processamento.</p><Button variant="outline" className="w-full rounded-2xl gap-2" onClick={onRefresh}><RefreshCw className="h-4 w-4" /> Atualizar</Button></CardContent></Card>}{minute?.processing_status === "failed" && <Card className="rounded-[1.25rem] border-destructive/30 shadow-lg"><CardContent className="space-y-3 p-5 text-sm text-destructive"><p>{minute.error_message || "Erro no processamento da ata."}</p><Button variant="outline" className="w-full rounded-2xl gap-2" onClick={() => onRetry(minute)} disabled={retrying}><RefreshCw className="h-4 w-4" /> {retrying ? "Tentando..." : "Tentar novamente"}</Button></CardContent></Card>}<DetailCard title="Resumo Executivo">{minute?.executive_summary || "Aguardando processamento."}</DetailCard><ListCard title="Decisões Tomadas" items={decisions} empty="Sem decisões registradas." /><ListCard title="Próximos Passos" items={actionItems} empty="Sem próximos passos." /><Card className="rounded-[1.25rem] shadow-lg"><CardHeader><CardTitle>Pontos de Atenção</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{attentionPoints.length ? attentionPoints.map((item, index) => <div key={index} className="rounded-2xl border border-warning/30 bg-warning/10 p-3 text-warning">• {item.descricao} <Badge variant="outline" className="ml-1 text-[10px]">{item.urgencia || "baixa"}</Badge></div>) : <p className="text-muted-foreground">Sem pontos críticos.</p>}</CardContent></Card><Card className="rounded-[1.25rem] shadow-lg"><CardHeader><CardTitle>Sentimento</CardTitle></CardHeader><CardContent><Badge variant="secondary" className="gap-2"><SentimentIcon className="h-4 w-4" /> {sentiment}</Badge></CardContent></Card><AiSuggestionsSection suggestions={pendingSuggestions} canReview={canReviewSuggestions} onApprove={onApproveSuggestion} onDiscard={onDiscardSuggestion} />{minute?.transcript && <Card className="rounded-[1.25rem] shadow-lg"><CardContent className="p-5"><Collapsible><CollapsibleTrigger asChild><Button variant="outline" className="w-full rounded-2xl gap-2">Transcript completo <ChevronDown className="h-4 w-4" /></Button></CollapsibleTrigger><CollapsibleContent className="mt-3 max-h-96 overflow-auto rounded-2xl bg-muted p-3 text-xs text-muted-foreground whitespace-pre-line">{minute.transcript}</CollapsibleContent></Collapsible></CardContent></Card>}</div>;
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card className="rounded-[1.25rem] shadow-lg"><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="whitespace-pre-line text-sm text-muted-foreground">{children}</CardContent></Card>;
}

function ListCard({ title, items, empty }: { title: string; items: any[]; empty: string }) {
  return <Card className="rounded-[1.25rem] shadow-lg"><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground">{items.length ? items.map((item, index) => <p key={index}>• {item.descricao} {item.responsavel ? `— ${item.responsavel}` : ""} {item.prazo ? `(${item.prazo})` : ""}</p>) : <p>{empty}</p>}</CardContent></Card>;
}

function AiSuggestionsSection({ suggestions, canReview, onApprove, onDiscard }: { suggestions: AiSuggestion[]; canReview: boolean; onApprove: (suggestion: AiSuggestion, changes?: Partial<AiSuggestion>) => void; onDiscard: (suggestion: AiSuggestion) => void }) {
  return <Card className="rounded-[1.25rem] shadow-lg"><CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-6 w-6 text-primary" /> Sugestões da IA ({suggestions.length})</CardTitle></CardHeader><CardContent className="space-y-3">{suggestions.length ? suggestions.map((suggestion) => <AiSuggestionCard key={suggestion.id} suggestion={suggestion} canReview={canReview} onApprove={onApprove} onDiscard={onDiscard} />) : <p className="text-sm text-muted-foreground">Sem sugestões pendentes.</p>}</CardContent></Card>;
}

function AiSuggestionCard({ suggestion, canReview, onApprove, onDiscard }: { suggestion: AiSuggestion; canReview: boolean; onApprove: (suggestion: AiSuggestion, changes?: Partial<AiSuggestion>) => void; onDiscard: (suggestion: AiSuggestion) => void }) {
  const [open, setOpen] = useState(false);
  const [descricao, setDescricao] = useState(suggestion.descricao);
  const [responsavel, setResponsavel] = useState(suggestion.responsavel_sugerido || "");
  const [prazo, setPrazo] = useState(suggestion.prazo_sugerido || "");
  const [audiencia, setAudiencia] = useState((suggestion.audiencia || []).join(", "));
  const tone = suggestion.tipo === "risco_detectado" ? "border-destructive/30 bg-destructive/10" : suggestion.tipo === "plano" ? "border-success/30 bg-success/10" : suggestion.tipo === "melhoria_operacional" ? "border-warning/30 bg-warning/10" : "border-primary/30 bg-primary/10";
  return <div className={cn("rounded-2xl border p-4", tone)}><Badge variant="secondary">{suggestion.tipo}</Badge><h3 className="mt-2 font-bold text-foreground">{suggestion.titulo}</h3><p className="mt-2 text-sm text-muted-foreground">{suggestion.descricao}</p><p className="mt-2 text-xs text-muted-foreground">Responsável: {suggestion.responsavel_sugerido || "—"} · Prazo: {suggestion.prazo_sugerido || "—"} · Avisar: {(suggestion.audiencia || []).join(", ") || "—"}</p><p className="mt-2 text-sm italic text-muted-foreground">{suggestion.beneficio_esperado}</p>{canReview && <div className="mt-3 grid gap-2 sm:grid-cols-3"><Button className="rounded-2xl gap-2" onClick={() => onApprove(suggestion)}><CheckCircle className="h-4 w-4" /> Aprovar</Button><Button variant="outline" className="rounded-2xl gap-2 bg-card" onClick={() => setOpen(true)}><Pencil className="h-4 w-4" /> Editar</Button><Button variant="outline" className="rounded-2xl gap-2 bg-card" onClick={() => onDiscard(suggestion)}><XCircle className="h-4 w-4" /> Descartar</Button></div>}<Dialog open={open} onOpenChange={setOpen}><DialogContent className="rounded-[1.25rem]"><DialogHeader><DialogTitle>Editar sugestão antes de enviar</DialogTitle></DialogHeader><div className="space-y-3"><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} /><Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Responsável" /><Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} /><Input value={audiencia} onChange={(e) => setAudiencia(e.target.value)} placeholder="Audiência separada por vírgula" /><Button className="w-full rounded-2xl" onClick={() => { onApprove(suggestion, { descricao, responsavel_sugerido: responsavel || null, prazo_sugerido: prazo || null, audiencia: audiencia.split(",").map((item) => item.trim()).filter(Boolean) }); setOpen(false); }}>Salvar e enviar</Button></div></DialogContent></Dialog></div>;
}
