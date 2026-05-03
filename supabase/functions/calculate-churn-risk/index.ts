// Calculate churn risk - cron daily 05:00 BRT
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

type Signal = { code: string; weight: number; detail?: string };

const WEIGHTS = {
  humor_baixo_5d: 25,
  advertencia_30d: 30,
  sem_kudos_30d: 10,
  leitura_baixa: 10,
  sem_huddle_atendimento: 10,
  sem_acesso_7d: 15,
};

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

async function generateAction(supabase: any, signals: Signal[], score: number): Promise<string> {
  const fallback = "Sugestão: agendar conversa 1:1 essa semana com escuta ativa, sem julgamento.";
  if (!LOVABLE_API_KEY || signals.length === 0) return fallback;
  try {
    const codes = signals.map((s) => s.code).join(", ");
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é coach de RH. Responda em PT-BR, 1-2 frases, foco em escuta empática, sem rotular o colaborador." },
          { role: "user", content: `Sinais de risco: ${codes}. Score: ${score}. Sugira ação concreta de 1:1.` },
        ],
      }),
    });
    if (!r.ok) return fallback;
    const j = await r.json();
    return j?.choices?.[0]?.message?.content?.trim() || fallback;
  } catch {
    return fallback;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const today = new Date().toISOString().slice(0, 10);
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const since14 = new Date(Date.now() - 14 * 86400000).toISOString();
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
  const since5 = new Date(Date.now() - 5 * 86400000).toISOString();

  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("user_id, unit_id, cargo, ativo")
    .in("cargo", ["colaborador", "encarregado", "lider_setor", "fiscal"])
    .eq("ativo", true)
    .not("user_id", "is", null);

  if (pErr) {
    return new Response(JSON.stringify({ error: pErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let processed = 0;
  let inserted = 0;
  const errors: string[] = [];

  for (const p of profiles ?? []) {
    processed++;
    const signals: Signal[] = [];

    // humor_baixo_5d
    await safe(async () => {
      const { data } = await supabase
        .from("daily_mood")
        .select("score, recorded_at")
        .eq("user_id", p.user_id)
        .gte("recorded_at", since5);
      if (data && data.length >= 3) {
        const avg = data.reduce((a: number, x: any) => a + Number(x.score), 0) / data.length;
        if (avg < 3) signals.push({ code: "humor_baixo_5d", weight: WEIGHTS.humor_baixo_5d, detail: `média ${avg.toFixed(1)}` });
      }
    }, undefined);

    // advertencia_30d
    await safe(async () => {
      const { count } = await supabase
        .from("advertencias")
        .select("id", { count: "exact", head: true })
        .eq("colaborador_id", p.user_id)
        .gte("created_at", since30);
      if ((count ?? 0) > 0) signals.push({ code: "advertencia_30d", weight: WEIGHTS.advertencia_30d, detail: `${count} em 30d` });
    }, undefined);

    // sem_kudos_30d
    await safe(async () => {
      const { count } = await supabase
        .from("praises")
        .select("id", { count: "exact", head: true })
        .eq("destinatario_id", p.user_id)
        .gte("criado_em", since30);
      if ((count ?? 0) === 0) signals.push({ code: "sem_kudos_30d", weight: WEIGHTS.sem_kudos_30d });
    }, undefined);

    // leitura_baixa - aviso_reads
    await safe(async () => {
      if (!p.unit_id) return;
      const { data: avisos } = await supabase
        .from("avisos")
        .select("id")
        .gte("created_at", since30);
      const total = avisos?.length ?? 0;
      if (total < 3) return;
      const { count: lidos } = await supabase
        .from("aviso_reads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", p.user_id)
        .gte("created_at", since30);
      const ratio = (lidos ?? 0) / total;
      if (ratio < 0.3) signals.push({ code: "leitura_baixa", weight: WEIGHTS.leitura_baixa, detail: `${Math.round(ratio * 100)}%` });
    }, undefined);

    // sem_huddle_atendimento (14d) - daily_huddles
    await safe(async () => {
      const { count } = await supabase
        .from("daily_huddles")
        .select("id", { count: "exact", head: true })
        .eq("created_by", p.user_id)
        .gte("created_at", since14);
      if ((count ?? 0) === 0) signals.push({ code: "sem_huddle_atendimento", weight: WEIGHTS.sem_huddle_atendimento });
    }, undefined);

    // sem_acesso_7d - via auth admin
    await safe(async () => {
      const { data } = await supabase.auth.admin.getUserById(p.user_id);
      const last = data?.user?.last_sign_in_at;
      if (!last || new Date(last).toISOString() < since7) {
        signals.push({ code: "sem_acesso_7d", weight: WEIGHTS.sem_acesso_7d, detail: last ? `último ${last.slice(0,10)}` : "nunca" });
      }
    }, undefined);

    const score = Math.min(100, signals.reduce((s, x) => s + x.weight, 0));
    if (score < 50) continue;

    const recommended = await generateAction(supabase, signals, score);

    // existed yesterday?
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const { data: prev } = await supabase
      .from("churn_risk_signals")
      .select("id")
      .eq("user_id", p.user_id)
      .gte("calculated_at", yesterday)
      .maybeSingle();

    const isNew = !prev;

    const { error: upErr } = await supabase
      .from("churn_risk_signals")
      .upsert({
        user_id: p.user_id,
        unit_id: p.unit_id,
        calculated_at: today,
        risk_score: score,
        signals,
        recommended_action: recommended,
        gerente_notified_at: isNew ? new Date().toISOString() : undefined,
        status: "ativo",
      }, { onConflict: "user_id,calculated_at" });

    if (upErr) { errors.push(upErr.message); continue; }
    inserted++;

    // Notify gerente_loja if new
    if (isNew && p.unit_id) {
      await safe(async () => {
        const { data: managers } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("unit_id", p.unit_id)
          .eq("cargo", "gerente_loja")
          .eq("ativo", true);
        for (const m of managers ?? []) {
          await supabase.from("notification_events").insert({
            type: "churn_risk_new",
            recipient_user_id: m.user_id,
            unit_id: p.unit_id,
            title: "Atenção: colaborador em risco",
            body: "Sinais comportamentais sugerem 1:1. Veja o painel de Risco.",
            payload: { target_user_id: p.user_id, score },
          });
        }
      }, undefined);
    }
  }

  // Escalate to RH: registros ativos com gerente_notified_at > 7d e sem rh_escalated_at
  await safe(async () => {
    const { data: stale } = await supabase
      .from("churn_risk_signals")
      .select("id, user_id, unit_id, risk_score")
      .eq("status", "ativo")
      .lt("gerente_notified_at", since7)
      .is("rh_escalated_at", null);
    if (!stale?.length) return;
    const { data: rh } = await supabase
      .from("profiles")
      .select("user_id, cargo, cargo_titulo, descricao, nome")
      .in("cargo", ["master", "admin"]);
    const rhIds = (rh ?? []).map((r: any) => r.user_id);
    for (const s of stale) {
      for (const uid of rhIds) {
        await supabase.from("notification_events").insert({
          type: "churn_risk_unattended",
          recipient_user_id: uid,
          unit_id: s.unit_id,
          title: "Risco de churn sem ação há 7 dias",
          body: "Gerente ainda não tratou. Veja /admin/risco-churn.",
          payload: { risk_id: s.id, target_user_id: s.user_id },
        });
      }
      await supabase
        .from("churn_risk_signals")
        .update({ rh_escalated_at: new Date().toISOString() })
        .eq("id", s.id);
    }
  }, undefined);

  return new Response(
    JSON.stringify({ processed, inserted, errors }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
