import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Phase = "monday" | "tuesday" | "wednesday" | "deadline_report";

function isoMonday(d = new Date()) {
  const day = d.getDay() || 7;
  const m = new Date(d);
  m.setDate(d.getDate() - (day - 1));
  m.setHours(0, 0, 0, 0);
  return m.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const phase: Phase = body.phase ?? "monday";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const monday = isoMonday();
    const { data: question } = await supabase
      .from("leadership_questions")
      .select("*")
      .eq("active", true)
      .lte("week_start_date", monday)
      .order("week_start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!question) {
      return new Response(JSON.stringify({ ok: true, skipped: "no active question" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Eligible users
    const { data: eligible } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("ativo", true)
      .in("cargo", question.target_roles as any);
    const eligibleIds = (eligible ?? []).map((p: any) => p.user_id);

    // Already answered
    const { data: answered } = await supabase
      .from("leadership_answers")
      .select("user_id")
      .eq("question_id", question.id);
    const answeredSet = new Set((answered ?? []).map((a: any) => a.user_id));

    let recipients: string[] = [];
    let title = "";
    let messageText = "";

    if (phase === "monday") {
      recipients = eligibleIds;
      title = "Pergunta da semana chegou";
      messageText = "Você tem até quarta 23:59 para responder.";
    } else if (phase === "tuesday") {
      recipients = eligibleIds.filter((id) => !answeredSet.has(id));
      title = "Lembrete: Pergunta da semana";
      messageText = "Ainda dá tempo de refletir e responder.";
    } else if (phase === "wednesday") {
      recipients = eligibleIds.filter((id) => !answeredSet.has(id));
      title = "Última chance: Pergunta da semana";
      messageText = "O prazo encerra hoje às 23:59.";
    } else if (phase === "deadline_report") {
      if (question.created_by) {
        recipients = [question.created_by];
        const total = eligibleIds.length;
        const answeredCount = answeredSet.size;
        title = "Relatório da Pergunta da Semana";
        messageText = `${answeredCount}/${total} líderes responderam.`;
      }
    }

    if (recipients.length) {
      const events = recipients.map((uid) => ({
        user_id: uid,
        event_type: "leadership_question",
        title,
        message: messageText,
        link: "/pergunta-semana",
        payload: { question_id: question.id, phase },
      }));
      // Try notification_events table; ignore if missing
      const { error } = await supabase.from("notification_events" as any).insert(events);
      if (error) console.warn("notification_events insert error", error.message);
    }

    return new Response(
      JSON.stringify({ ok: true, phase, sent: recipients.length, question_id: question.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
