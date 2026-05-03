import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const ELIGIBLE_CARGOS = ["gerente_loja", "gerente_adm", "supervisor", "master", "admin"];

type Snapshot = Record<string, unknown>;

async function safe<T>(p: Promise<T>): Promise<T | null> {
  try { return await p; } catch (e) { console.warn("safe block failed:", (e as Error).message); return null; }
}

function suggestionLink(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes("checklist")) return "/checklist-diario";
  if (t.includes("advert")) return "/advertencias";
  if (t.includes("suspens")) return "/suspensoes";
  if (t.includes("huddle") || t.includes("reuni")) return "/daily-huddle";
  if (t.includes("compromiss")) return "/compromissos";
  if (t.includes("aviso")) return "/avisos";
  if (t.includes("aniversari")) return "/";
  if (t.includes("hist")) return "/admin-historias";
  if (t.includes("clima") || t.includes("humor")) return "/clima";
  if (t.includes("treinamento") || t.includes("cápsula") || t.includes("capsula")) return "/treinamento";
  return null;
}

async function buildSnapshot(supabase: any, profile: any): Promise<Snapshot> {
  const unitId = profile.unit_id as string | null;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const snap: Snapshot = { unit_id: unitId, cargo: profile.cargo };

  if (unitId) {
    const mood = await safe(supabase.from("daily_mood").select("score").eq("unit_id", unitId).gte("recorded_at", sevenDaysAgo));
    if (mood?.data?.length) {
      const scores = mood.data.map((m: any) => m.score);
      snap.mood_avg = +(scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(2);
      snap.mood_low_count = scores.filter((s: number) => s < 3).length;
    }

    const checklists = await safe(supabase.from("checklist_completions").select("id,status").eq("unit_id", unitId).gte("data", sevenDaysAgo.slice(0, 10)));
    if (checklists?.data) {
      const total = checklists.data.length;
      const done = checklists.data.filter((c: any) => c.status === "completo").length;
      snap.checklist_pct = total ? Math.round((done / total) * 100) : null;
    }

    const adv = await safe(supabase.from("advertencias").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo));
    snap.advertencias_7d = adv?.count ?? 0;

    const occ = await safe(supabase.from("leadership_occurrences").select("id", { count: "exact", head: true }).eq("unit_id", unitId).gte("created_at", sevenDaysAgo));
    snap.ocorrencias_7d = occ?.count ?? 0;

    const susp = await safe(supabase.from("suspensoes").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo));
    snap.suspensoes_7d = susp?.count ?? 0;

    const huddles = await safe(supabase.from("daily_huddle").select("id", { count: "exact", head: true }).eq("unit_id", unitId).gte("data", sevenDaysAgo.slice(0, 10)));
    snap.huddles_7d = huddles?.count ?? 0;

    const today = new Date(); const next7 = new Date(Date.now() + 7 * 86400_000);
    const bd = await safe(supabase.from("profiles").select("nome,data_nascimento").eq("unit_id", unitId).eq("ativo", true).not("data_nascimento", "is", null));
    if (bd?.data) {
      const upcoming = bd.data.filter((p: any) => {
        if (!p.data_nascimento) return false;
        const d = new Date(p.data_nascimento); d.setFullYear(today.getFullYear());
        return d >= today && d <= next7;
      }).map((p: any) => p.nome);
      snap.aniversariantes_7d = upcoming.slice(0, 5);
    }
  }

  const avisos = await safe(supabase.from("avisos").select("id", { count: "exact", head: true }).eq("ativo", true));
  snap.avisos_ativos = avisos?.count ?? 0;

  if (profile.cargo === "admin" || profile.cargo === "master" || profile.cargo === "gerente_adm") {
    const stories = await safe(supabase.from("curio_stories").select("id", { count: "exact", head: true }).eq("status", "pendente"));
    snap.stories_pendentes = stories?.count ?? 0;
  }

  return snap;
}

async function callLLM(profile: any, snapshot: Snapshot): Promise<{ saudacao: string; acoes: string[]; destaque: string; alerta: string | null } | null> {
  try {
    const sys = `Você é o Curiozinho, mascote-assistente do Curió Supermercado. Gera uma carta-briefing matinal pra um líder. Tom: direto, acolhedor, em português brasileiro. Máx 200 palavras totais.`;
    const user = `Perfil: ${profile.nome} (${profile.cargo}). Dados últimos 7 dias da unidade:\n${JSON.stringify(snapshot, null, 2)}\n\nGere a carta com saudação curta, 3 ações concretas pra hoje, 1 destaque positivo, e 1 alerta (ou null se nada crítico).`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        tools: [{
          type: "function",
          function: {
            name: "render_briefing",
            description: "Estrutura a carta",
            parameters: {
              type: "object",
              properties: {
                saudacao: { type: "string" },
                acoes: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
                destaque: { type: "string" },
                alerta: { type: ["string", "null"] },
              },
              required: ["saudacao", "acoes", "destaque", "alerta"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "render_briefing" } },
      }),
    });
    if (!res.ok) { console.error("LLM err", res.status, await res.text()); return null; }
    const j = await res.json();
    const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return null;
    return JSON.parse(args);
  } catch (e) {
    console.error("LLM exception", e);
    return null;
  }
}

function buildMarkdown(b: { saudacao: string; acoes: string[]; destaque: string; alerta: string | null }): string {
  let md = `${b.saudacao}\n\n## Top 3 ações pra hoje\n`;
  b.acoes.forEach((a, i) => { md += `${i + 1}. ${a}\n`; });
  md += `\n## ✨ Destaque\n${b.destaque}\n`;
  if (b.alerta) md += `\n## ⚠️ Alerta\n${b.alerta}\n`;
  return md;
}

function buildAlerts(snap: Snapshot, llmAlerta: string | null) {
  const alerts: { severity: "info" | "warn" | "crit"; label: string; link?: string }[] = [];
  if ((snap.mood_avg as number) && (snap.mood_avg as number) < 3) alerts.push({ severity: "crit", label: `Humor médio baixo (${snap.mood_avg})`, link: "/clima" });
  if ((snap.checklist_pct as number) !== null && (snap.checklist_pct as number) < 60) alerts.push({ severity: "warn", label: `Checklists só ${snap.checklist_pct}%`, link: "/checklist-diario" });
  if ((snap.advertencias_7d as number) >= 3) alerts.push({ severity: "warn", label: `${snap.advertencias_7d} advertências em 7 dias`, link: "/advertencias" });
  if (llmAlerta) alerts.push({ severity: "info", label: llmAlerta });
  return alerts;
}

function buildSuggestions(acoes: string[]) {
  return acoes.map((a) => ({ title: a, action_label: "Fazer agora", link: suggestionLink(a) ?? "/" }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const today = new Date().toISOString().slice(0, 10);
  const result = { processed: 0, skipped: 0, errors: 0, fallbacks: 0 };

  try {
    const { data: users, error } = await supabase
      .from("profiles")
      .select("user_id, nome, cargo, unit_id")
      .eq("ativo", true)
      .not("user_id", "is", null)
      .in("cargo", ELIGIBLE_CARGOS);
    if (error) throw error;

    for (const profile of users ?? []) {
      try {
        const { data: existing } = await supabase
          .from("curiozinho_briefings").select("id").eq("user_id", profile.user_id).eq("briefing_date", today).maybeSingle();
        if (existing) { result.skipped++; continue; }

        const snapshot = await buildSnapshot(supabase, profile);
        const llm = await callLLM(profile, snapshot);

        let content_markdown: string;
        let alerts: any[] = [];
        let suggestions: any[] = [];
        if (llm) {
          content_markdown = buildMarkdown(llm);
          alerts = buildAlerts(snapshot, llm.alerta);
          suggestions = buildSuggestions(llm.acoes);
        } else {
          result.fallbacks++;
          content_markdown = `Bom dia, ${profile.nome?.split(" ")[0] ?? "líder"}! 🐦\n\nHoje sem novidades automáticas. Confira seu painel e conduza o time com presença.`;
          alerts = buildAlerts(snapshot, null);
          suggestions = [];
        }

        await supabase.from("curiozinho_briefings").insert({
          user_id: profile.user_id,
          briefing_date: today,
          content_markdown,
          alerts,
          suggestions,
          data_snapshot: snapshot,
        });
        result.processed++;
      } catch (e) {
        console.error("user err", profile.user_id, e);
        result.errors++;
      }
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("fatal", e);
    return new Response(JSON.stringify({ error: (e as Error).message, ...result }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
