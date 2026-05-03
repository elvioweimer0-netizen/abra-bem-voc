// Generate meeting agenda — chamada por cron diário 09:25 BRT (seg-sex).
// Para cada unidade de loja, coleta sinais das últimas 24h e monta uma pauta sugerida pro Daily Huddle.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Topico = {
  tipo: "alerta" | "reconhecimento" | "decisao";
  titulo: string;
  acao_sugerida: string;
  deep_link: string;
  fonte: string;
};

const todayBRT = () => {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Fortaleza" }));
  return d.toISOString().slice(0, 10);
};

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try { return await fn(); } catch (e) { console.error(`[agenda] ${label} falhou:`, e); return fallback; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key);

  const today = todayBRT();
  const { data: units } = await sb.from("units").select("id, code, name, type");
  const lojas = (units ?? []).filter((u: any) => (u.type ?? "").toLowerCase() !== "central");

  let generated = 0;

  for (const u of lojas) {
    const topicos: Topico[] = [];

    // 1) Heatmap — top 3 piores indicadores
    const heatmap = await safe(async () => {
      const { data } = await sb.rpc("fn_heatmap_indicators", { _period: "hoje" });
      return (data ?? []).find((r: any) => r.unit_id === u.id);
    }, null as any, "heatmap");
    if (heatmap) {
      const indicadores = [
        { k: "total_advertencias", label: "advertência(s) recente(s)", link: "/advertencias" },
        { k: "total_ocorrencias", label: "ocorrência(s) abertas", link: "/bo-eletronico" },
        { k: "total_suspensoes", label: "suspensão(ões)", link: "/suspensoes" },
        { k: "total_checklist_atrasados", label: "checklist(s) atrasado(s)", link: "/checklist-diario" },
        { k: "total_faltas_setor", label: "falta(s) recente(s)", link: "/escala-semana" },
        { k: "total_vagas_abertas", label: "vaga(s) em aberto", link: "/colaboradores" },
        { k: "mood_baixo_count", label: "humor baixo na equipe", link: "/clima" },
        { k: "avisos_pendentes", label: "aviso(s) urgente(s) sem leitura", link: "/avisos" },
      ];
      const piores = indicadores
        .map((i) => ({ ...i, n: Number(heatmap[i.k] ?? 0) }))
        .filter((i) => i.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 3);
      for (const p of piores) {
        topicos.push({
          tipo: "alerta",
          titulo: `${p.n} ${p.label}`,
          acao_sugerida: "Discutir causa e responsável.",
          deep_link: p.link,
          fonte: "heatmap",
        });
      }
    }

    // 2) Compromissos vencendo hoje
    await safe(async () => {
      const { data } = await sb
        .from("weekly_commitments")
        .select("id, titulo, due_date, status, unit_id")
        .eq("unit_id", u.id)
        .eq("due_date", today)
        .neq("status", "concluido")
        .limit(3);
      for (const c of data ?? []) {
        topicos.push({
          tipo: "decisao",
          titulo: `Compromisso vence hoje: ${c.titulo}`,
          acao_sugerida: "Confirmar entrega ou repactuar prazo.",
          deep_link: "/compromissos",
          fonte: "compromissos",
        });
      }
    }, undefined, "compromissos");

    // 3) PDI próximo do prazo
    await safe(async () => {
      const inSeven = new Date(); inSeven.setDate(inSeven.getDate() + 7);
      const { data } = await sb
        .from("pdi_goals")
        .select("id, titulo, prazo, status, unit_id")
        .eq("unit_id", u.id)
        .lte("prazo", inSeven.toISOString().slice(0, 10))
        .neq("status", "concluida")
        .limit(2);
      for (const g of data ?? []) {
        topicos.push({
          tipo: "decisao",
          titulo: `PDI vencendo: ${g.titulo}`,
          acao_sugerida: "Revisar progresso com o encarregado.",
          deep_link: "/pdi",
          fonte: "pdi",
        });
      }
    }, undefined, "pdi");

    // 4) Aniversariantes do dia
    await safe(async () => {
      const { data } = await sb
        .from("profiles")
        .select("nome, data_nascimento, unit_id, ativo")
        .eq("unit_id", u.id)
        .eq("ativo", true);
      const [_, mm, dd] = today.split("-");
      const birthdays = (data ?? []).filter((p: any) => {
        if (!p.data_nascimento) return false;
        const [, m, d] = p.data_nascimento.split("-");
        return m === mm && d === dd;
      });
      for (const b of birthdays) {
        topicos.push({
          tipo: "reconhecimento",
          titulo: `🎂 Aniversário: ${b.nome}`,
          acao_sugerida: "Parabenizar a equipe na reunião.",
          deep_link: "/",
          fonte: "aniversarios",
        });
      }
    }, undefined, "aniversarios");

    // 5) Avisos urgentes (apenas título)
    await safe(async () => {
      const { data } = await sb
        .from("avisos")
        .select("id, titulo, urgente, ativo, unidade")
        .eq("ativo", true)
        .eq("urgente", true)
        .or(`unidade.is.null,unidade.eq.${u.code}`)
        .limit(2);
      for (const a of data ?? []) {
        topicos.push({
          tipo: "alerta",
          titulo: `Aviso urgente: ${a.titulo}`,
          acao_sugerida: "Garantir que toda equipe leu.",
          deep_link: `/avisos/${a.id}`,
          fonte: "avisos",
        });
      }
    }, undefined, "avisos");

    // 6) Curió de Ouro recente (últimos 7 dias)
    await safe(async () => {
      const since = new Date(); since.setDate(since.getDate() - 7);
      const { data } = await sb
        .from("praises")
        .select("id, destinatario_id, criado_em")
        .gte("criado_em", since.toISOString())
        .order("criado_em", { ascending: false })
        .limit(1);
      if (data && data.length) {
        topicos.push({
          tipo: "reconhecimento",
          titulo: "Reconhecer Curió de Ouro recente",
          acao_sugerida: "Citar nome e ato na reunião.",
          deep_link: "/curio-de-ouro",
          fonte: "curio_ouro",
        });
      }
    }, undefined, "curio_ouro");

    // Prioriza alertas, limita 6
    topicos.sort((a, b) => (a.tipo === "alerta" ? -1 : 1) - (b.tipo === "alerta" ? -1 : 1));
    const finalTopicos = topicos.slice(0, 6);
    const tempo = Math.max(10, Math.min(20, finalTopicos.length * 2 + 4));

    const suggested_agenda = {
      generated_at: new Date().toISOString(),
      tempo_estimado_min: tempo,
      topicos: finalTopicos,
    };

    // Upsert preservando campos do gerente
    const { data: existing } = await sb
      .from("daily_huddle_reports")
      .select("id, agenda_used, final_agenda")
      .eq("unit_id", u.id)
      .eq("report_date", today)
      .maybeSingle();

    if (existing) {
      await sb
        .from("daily_huddle_reports")
        .update({ suggested_agenda })
        .eq("id", existing.id);
    } else {
      await sb.from("daily_huddle_reports").insert({
        unit_id: u.id,
        report_date: today,
        bo_dia: "",
        informativos: "",
        meta_status: "no_caminho",
        observacao: "",
        suggested_agenda,
      });
    }
    generated++;

    // Push pros gerentes da unidade
    await safe(async () => {
      const { data: managers } = await sb
        .from("profiles")
        .select("user_id, ativo, cargo, unit_id")
        .eq("unit_id", u.id)
        .eq("ativo", true)
        .in("cargo", ["gerente", "gerente_loja", "encarregado"]);
      const events = (managers ?? [])
        .filter((m: any) => m.user_id)
        .map((m: any) => ({
          type: "huddle_agenda_ready",
          recipient_user_id: m.user_id,
          unit_id: u.id,
          title: "Pauta da reunião 9:30 pronta",
          body: "📋 Pauta sugerida pelo Curiozinho tá no app.",
          payload: { deep_link: "/daily-huddle", topicos: finalTopicos.length },
        }));
      if (events.length) await sb.from("notification_events").insert(events);
    }, undefined, "push");
  }

  return new Response(JSON.stringify({ ok: true, units: lojas.length, generated }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
