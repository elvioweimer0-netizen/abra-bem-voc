import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type GeneratedMinutes = {
  titulo?: string;
  executive_summary?: string;
  decisions?: Array<{ descricao?: string; responsavel?: string | null }>;
  action_items?: Array<{ descricao?: string; responsavel?: string | null; prazo?: string | null; metrica_sucesso?: string | null }>;
  attention_points?: Array<{ descricao?: string; urgencia?: "baixa" | "media" | "alta" }>;
  sentiment?: "positivo" | "neutro" | "tenso";
  ai_suggestions?: Array<{
    tipo?: "ideia" | "plano" | "melhoria_operacional" | "risco_detectado";
    titulo?: string;
    descricao?: string;
    responsavel_sugerido?: string | null;
    prazo_sugerido?: string | null;
    beneficio_esperado?: string;
    pra_quem_avisar?: string[];
  }>;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractMeetingId(payload: any) {
  const direct = payload?.meeting_id || payload?.meetingId || payload?.data?.meeting_id || payload?.data?.meetingId;
  if (typeof direct === "string") return direct;

  const roomName = payload?.room_name || payload?.data?.room_name || payload?.room?.name || payload?.data?.room?.name;
  if (typeof roomName === "string" && roomName.startsWith("curio-diaria-")) return roomName.replace("curio-diaria-", "");
  return null;
}

function extractRecordingUrl(payload: any) {
  const candidates = [payload?.recording_url, payload?.audio_url, payload?.storage_url, payload?.download_url, payload?.url, payload?.data?.recording_url, payload?.data?.download_url, payload?.data?.url, payload?.recording?.download_url, payload?.data?.recording?.download_url];
  return candidates.find((value) => typeof value === "string") || null;
}

function fallbackMeetingTitle(meeting?: { type?: string | null; scheduled_date?: string | null } | null) {
  const labels: Record<string, string> = { diaria: "Diária", semanal: "Semanal", individual: "Individual" };
  const type = labels[meeting?.type || ""] || "Manual";
  const date = meeting?.scheduled_date ? meeting.scheduled_date.split("-").reverse().join("/") : new Date().toLocaleDateString("pt-BR");
  return `Reunião ${type} do dia ${date}`;
}

async function downloadRecording(url: string, dailyApiKey?: string) {
  const response = await fetch(url, { headers: dailyApiKey ? { Authorization: `Bearer ${dailyApiKey}` } : undefined });
  if (!response.ok) throw new Error(`Falha ao baixar gravação (${response.status})`);
  const blob = await response.blob();
  return new File([blob], "meeting-recording.mp4", { type: blob.type || "audio/mp4" });
}

async function transcribeAudio(audioFile: File, openAiKey: string) {
  const form = new FormData();
  form.append("model", "whisper-1");
  form.append("file", audioFile);

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${openAiKey}` }, body: form });
  if (!response.ok) throw new Error(`Falha na transcrição (${response.status}): ${await response.text()}`);
  const data = await response.json();
  return data.text as string;
}

async function generateMinutes(transcript: string, openAiKey: string): Promise<GeneratedMinutes> {
  const prompt = `Você é o assistente IA do Supermercado Curió. Analisou uma reunião operacional. Gere JSON válido com:

{
  'titulo': string curto e claro descrevendo o tema principal da reunião (ex: 'Alinhamento Vendas Semana / B.O. Loja 04', 'Treinamento Atendimento Frente Caixa'),
  'executive_summary': string (5 linhas),
  'decisions': [{descricao, responsavel}],
  'action_items': [{descricao, responsavel, prazo (YYYY-MM-DD ou null), metrica_sucesso}],
  'attention_points': [{descricao, urgencia: 'baixa'|'media'|'alta'}],
  'sentiment': 'positivo'|'neutro'|'tenso',
  'ai_suggestions': [
    {
      'tipo': 'ideia'|'plano'|'melhoria_operacional'|'risco_detectado',
      'titulo': string curto,
      'descricao': string detalhada (até 3 linhas),
      'responsavel_sugerido': string ou null,
      'prazo_sugerido': YYYY-MM-DD ou null,
      'beneficio_esperado': string,
      'pra_quem_avisar': ['admin','supervisor','gerentes','equipe','setor:acougue', etc.]
    }
  ]
}

Seja PROATIVO: gere 3-7 sugestões mesmo que a reunião tenha sido curta. Use seu conhecimento de varejo de supermercado.

TRANSCRIPT: ${transcript}

Retorne APENAS JSON válido, sem markdown.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
  });
  if (!response.ok) throw new Error(`Falha ao gerar ata (${response.status}): ${await response.text()}`);
  const data = await response.json();
  return JSON.parse(data.choices?.[0]?.message?.content || "{}");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method === "GET") return jsonResponse({ ok: true });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY") || undefined;
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !OPENAI_API_KEY) return jsonResponse({ error: "Configuração de processamento incompleta" }, 500);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const contentType = req.headers.get("content-type") || "";
    let meetingId: string | null = null;
    let recordingUrl: string | null = null;
    let recordingFile: File | null = null;
    let recordingFilePath: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      meetingId = String(form.get("meetingId") || "");
      const file = form.get("file");
      if (file instanceof File) recordingFile = file;
    } else {
      const payload = await req.json().catch(() => ({}));
      meetingId = extractMeetingId(payload);
      recordingUrl = extractRecordingUrl(payload);
      recordingFilePath = typeof payload?.recording_file_path === "string" ? payload.recording_file_path : null;
    }

    if (!meetingId) return jsonResponse({ ok: true, ignored: "meeting_id não encontrado no webhook/upload" });
    const { data: minute } = await supabase.from("meeting_minutes").upsert({ meeting_id: meetingId, recording_url: recordingUrl, processing_status: "processing" }, { onConflict: "meeting_id" }).select("id").single();

    try {
      if (!recordingFile && recordingUrl) recordingFile = await downloadRecording(recordingUrl, DAILY_API_KEY);
      if (!recordingFile) throw new Error("URL ou arquivo de gravação não informado");
      if (!recordingUrl) {
        recordingFilePath = `${meetingId}/${Date.now()}-${recordingFile.name}`;
        await supabase.storage.from("meeting-recordings").upload(recordingFilePath, recordingFile, { upsert: true });
      }

      const { data: meetingInfo } = await supabase.from("leadership_meetings").select("type, scheduled_date, title").eq("id", meetingId).single();
      const transcript = await transcribeAudio(recordingFile, OPENAI_API_KEY);
      const generated = await generateMinutes(transcript, OPENAI_API_KEY);
      const actionItems = Array.isArray(generated.action_items) ? generated.action_items : [];
      const aiSuggestions = Array.isArray(generated.ai_suggestions) ? generated.ai_suggestions.slice(0, 7) : [];
      const generatedTitle = generated.titulo?.trim() || meetingInfo?.title?.trim() || fallbackMeetingTitle(meetingInfo);
      const { data: savedMinute } = await supabase.from("meeting_minutes").upsert({
        meeting_id: meetingId,
        recording_url: recordingUrl,
        recording_file_path: recordingFilePath,
        titulo: generatedTitle,
        transcript,
        executive_summary: generated.executive_summary || "",
        decisions: generated.decisions || [],
        action_items: actionItems,
        attention_points: generated.attention_points || [],
        sentiment: generated.sentiment || "neutro",
        processing_status: "completed",
        error_message: null,
        processed_at: new Date().toISOString(),
      }, { onConflict: "meeting_id" }).select("id").single();

      await supabase.from("meeting_action_items").delete().eq("meeting_id", meetingId);
      if (actionItems.length && savedMinute?.id) {
        await supabase.from("meeting_action_items").insert(actionItems.map((item) => ({ meeting_id: meetingId, minute_id: savedMinute.id, descricao: item.descricao || "Próximo passo", responsavel: item.responsavel || null, prazo: item.prazo || null })));
      }

      await supabase.from("ai_suggestions").delete().eq("meeting_id", meetingId).eq("status", "pendente");
      if (aiSuggestions.length) {
        await supabase.from("ai_suggestions").insert(aiSuggestions.map((item) => ({
          meeting_id: meetingId,
          tipo: item.tipo || "ideia",
          titulo: item.titulo || "Sugestão da IA",
          descricao: item.descricao || "Revisar oportunidade identificada na reunião.",
          responsavel_sugerido: item.responsavel_sugerido || null,
          prazo_sugerido: item.prazo_sugerido || null,
          beneficio_esperado: item.beneficio_esperado || "Melhorar a execução operacional.",
          audiencia: Array.isArray(item.pra_quem_avisar) ? item.pra_quem_avisar : [],
        })));
      }

      await supabase.from("leadership_meetings").update({ status: "encerrada", ended_at: new Date().toISOString(), title: generatedTitle, minutes: generated.executive_summary || "Ata gerada automaticamente" }).eq("id", meetingId);
      await supabase.from("notification_events").insert({ type: "meeting_minutes", title: "Ata da reunião está pronta!", body: "Toque para ver.", payload: { meeting_id: meetingId } });
      if (aiSuggestions.length) {
        await supabase.from("notification_events").insert({ type: "meeting_minutes", title: `🤖 Curió Conecta sugeriu ${aiSuggestions.length} ações da reunião '${generatedTitle}'`, body: "Toque pra revisar.", payload: { meeting_id: meetingId, pending_ai_suggestions: aiSuggestions.length } });
      }
      return jsonResponse({ ok: true, meetingId });
    } catch (error) {
      await supabase.from("meeting_minutes").update({ processing_status: "failed", error_message: error instanceof Error ? error.message : "Erro desconhecido" }).eq("id", minute?.id);
      throw error;
    }
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Erro desconhecido" }, 500);
  }
});
