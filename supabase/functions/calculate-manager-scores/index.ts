import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Dim = { code: string; weight: number; metric_query_name: string };

function clamp(n: number, min = 0, max = 100) {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(min, Math.min(max, n));
}

function monthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { startISO: start.toISOString(), endISO: end.toISOString(), startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

function businessDaysIn(year: number, month: number) {
  let n = 0;
  const days = new Date(year, month, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const wd = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
    if (wd !== 0 && wd !== 6) n++;
  }
  return n;
}

async function safeCall<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn(); } catch (e) { console.warn("dim error", e); return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const url = new URL(req.url);
  const now = new Date();
  // default = previous month
  const refMonth = parseInt(url.searchParams.get("month") ?? "") || (now.getUTCMonth() === 0 ? 12 : now.getUTCMonth());
  const refYear = parseInt(url.searchParams.get("year") ?? "") || (now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear());
  const dryRun = url.searchParams.get("dry_run") === "1";
  const { startISO, endISO, startDate, endDate } = monthRange(refYear, refMonth);
  const businessDays = businessDaysIn(refYear, refMonth);

  const { data: dims, error: dimsErr } = await sb
    .from("manager_score_dimensions").select("code,weight,metric_query_name,active").eq("active", true);
  if (dimsErr) {
    return new Response(JSON.stringify({ error: dimsErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const dimensions = (dims ?? []) as Dim[];

  const { data: managers, error: mErr } = await sb
    .from("profiles").select("user_id,unit_id,nome,cargo,unidade")
    .in("cargo", ["gerente_loja", "gerente_adm", "encarregado"])
    .eq("ativo", true)
    .not("user_id", "is", null);
  if (mErr) {
    return new Response(JSON.stringify({ error: mErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Pre-fetch network-wide praises stats for normalization (per month)
  let praiseGivenByUser: Record<string, number> = {};
  let praiseReceivedByUnit: Record<string, number> = {};
  await safeCall(async () => {
    const { data } = await sb.from("praises").select("autor_id,unit_id,destinatario_id,criado_em")
      .gte("criado_em", startISO).lt("criado_em", endISO);
    for (const p of (data ?? []) as any[]) {
      praiseGivenByUser[p.autor_id] = (praiseGivenByUser[p.autor_id] ?? 0) + 1;
      if (p.unit_id) praiseReceivedByUnit[p.unit_id] = (praiseReceivedByUnit[p.unit_id] ?? 0) + 1;
    }
  });
  const maxGiven = Math.max(1, ...Object.values(praiseGivenByUser));
  const maxReceived = Math.max(1, ...Object.values(praiseReceivedByUnit));

  const results: any[] = [];

  for (const m of (managers ?? []) as any[]) {
    const userId = m.user_id as string;
    const unitId = m.unit_id as string | null;
    const unidade = m.unidade as string | null;

    const dimResults: Record<string, { raw: number; weight_original: number; weight_used: number; weighted: number; status: "ok" | "skipped" }> = {};

    // Calculate each dimension
    const calc = async (code: string): Promise<number | null> => {
      switch (code) {
        case "checklist_completion_rate": {
          if (!unitId) return null;
          return await safeCall(async () => {
            const [{ count: tplCount }, { count: doneCount }] = await Promise.all([
              sb.from("checklist_templates").select("id", { count: "exact", head: true }).eq("active", true),
              sb.from("checklist_completions").select("id", { count: "exact", head: true })
                .eq("unit_id", unitId).gte("data", startDate).lt("data", endDate).eq("status", "completo"),
            ]);
            const expected = (tplCount ?? 0) * businessDays;
            if (expected === 0) return 0;
            return clamp(((doneCount ?? 0) / expected) * 100);
          }) ?? null;
        }
        case "aviso_read_rate": {
          if (!unitId) return null;
          return await safeCall(async () => {
            // % avisos pertinentes lidos pelo gerente no mês
            const { data: avisos } = await sb.from("avisos").select("id,unidade,ativo")
              .eq("ativo", true)
              .gte("created_at", startISO).lt("created_at", endISO);
            const relevant = (avisos ?? []).filter((a: any) => !a.unidade || a.unidade === unidade);
            if (relevant.length === 0) return 0;
            const ids = relevant.map((a: any) => a.id);
            const { count: myReads } = await sb.from("aviso_reads").select("id", { count: "exact", head: true })
              .eq("user_id", userId).in("aviso_id", ids);
            return clamp(((myReads ?? 0) / relevant.length) * 100);
          }) ?? null;
        }
        case "daily_huddle_rate": {
          if (!unitId) return null;
          return await safeCall(async () => {
            const { count } = await sb.from("daily_huddle_reports").select("id", { count: "exact", head: true })
              .eq("unit_id", unitId).gte("report_date", startDate).lt("report_date", endDate);
            if (businessDays === 0) return 0;
            return clamp(((count ?? 0) / businessDays) * 100);
          }) ?? null;
        }
        case "commitments_fulfillment": {
          return await safeCall(async () => {
            const { data } = await sb.from("weekly_commitments").select("status,week_start_date")
              .eq("user_id", userId)
              .gte("week_start_date", startDate).lt("week_start_date", endDate);
            const rows = (data ?? []) as any[];
            const closed = rows.filter((r) => ["cumprido", "parcial", "nao_cumprido"].includes(r.status));
            if (closed.length === 0) return null as unknown as number;
            const fulfilled = closed.reduce((s, r) => s + (r.status === "cumprido" ? 1 : r.status === "parcial" ? 0.5 : 0), 0);
            return clamp((fulfilled / closed.length) * 100);
          }) ?? null;
        }
        case "praises_normalized": {
          const given = praiseGivenByUser[userId] ?? 0;
          const recv = unitId ? (praiseReceivedByUnit[unitId] ?? 0) : 0;
          if (given === 0 && recv === 0) return null;
          return clamp(((given / maxGiven) * 50) + ((recv / maxReceived) * 50));
        }
        case "advertencia_inverse": {
          if (!unidade) return null;
          return await safeCall(async () => {
            const { count } = await sb.from("advertencias").select("id", { count: "exact", head: true })
              .eq("unidade", unidade).gte("data", startDate).lt("data", endDate);
            return clamp(100 - ((count ?? 0) * 10));
          }) ?? null;
        }
        case "mood_average": {
          if (!unitId) return null;
          return await safeCall(async () => {
            const { data } = await sb.from("daily_mood").select("score")
              .eq("unit_id", unitId).gte("recorded_at", startISO).lt("recorded_at", endISO).not("score", "is", null);
            const rows = (data ?? []) as any[];
            if (rows.length === 0) return null as unknown as number;
            const avg = rows.reduce((s, r) => s + (r.score ?? 0), 0) / rows.length;
            return clamp(avg * 20);
          }) ?? null;
        }
        case "training_completion": {
          return await safeCall(async () => {
            const { count: totalModules } = await sb.from("training_modules").select("id", { count: "exact", head: true }).eq("active", true);
            if (!totalModules) return null as unknown as number;
            const { count: myDone } = await sb.from("training_completions").select("id", { count: "exact", head: true }).eq("user_id", userId);
            const myPct = ((myDone ?? 0) / totalModules) * 100;

            let teamPct = 0;
            if (unitId) {
              const { data: team } = await sb.from("profiles").select("user_id")
                .eq("unit_id", unitId).eq("ativo", true).not("user_id", "is", null);
              const ids = (team ?? []).map((t: any) => t.user_id).filter(Boolean);
              if (ids.length > 0) {
                const { data: comps } = await sb.from("training_completions").select("user_id").in("user_id", ids);
                const counts: Record<string, number> = {};
                for (const c of (comps ?? []) as any[]) counts[c.user_id] = (counts[c.user_id] ?? 0) + 1;
                const sum = ids.reduce((s, id) => s + ((counts[id] ?? 0) / totalModules) * 100, 0);
                teamPct = sum / ids.length;
              }
            }
            return clamp((myPct + teamPct) / 2);
          }) ?? null;
        }
      }
      return null;
    };

    // 1st pass: compute raw + record skipped
    let activeWeight = 0;
    for (const d of dimensions) {
      const raw = await calc(d.metric_query_name);
      if (raw === null) {
        dimResults[d.code] = { raw: 0, weight_original: Number(d.weight), weight_used: 0, weighted: 0, status: "skipped" };
      } else {
        dimResults[d.code] = { raw: Number(raw.toFixed(2)), weight_original: Number(d.weight), weight_used: 0, weighted: 0, status: "ok" };
        activeWeight += Number(d.weight);
      }
    }

    // 2nd pass: redistribute weights so active dims sum to 100
    let final = 0;
    if (activeWeight > 0) {
      const factor = 100 / activeWeight;
      for (const code of Object.keys(dimResults)) {
        const r = dimResults[code];
        if (r.status === "ok") {
          r.weight_used = Number((r.weight_original * factor).toFixed(2));
          r.weighted = Number(((r.raw * r.weight_used) / 100).toFixed(2));
          final += r.weighted;
        }
      }
    }
    final = Number(clamp(final).toFixed(2));

    results.push({ user_id: userId, unit_id: unitId, nome: m.nome, final_score: final, dimension_breakdown: dimResults });

    if (!dryRun) {
      await sb.from("manager_scores_monthly").upsert({
        user_id: userId, year: refYear, month: refMonth, unit_id: unitId,
        final_score: final, dimension_breakdown: dimResults, calculated_at: new Date().toISOString(),
      }, { onConflict: "user_id,year,month" });

      await sb.from("notification_events").insert({
        type: "manager_score_calculated",
        title: "Seu Score do mês saiu 📊",
        body: `Score: ${final.toFixed(1)}/100. Veja seu detalhe.`,
        recipient_user_id: userId,
        unit_id: unitId,
        payload: { year: refYear, month: refMonth, final_score: final },
      });
    }
  }

  // Top/bottom push to admins (Roberto/Guga + master/admin)
  if (!dryRun && results.length > 0) {
    const sorted = [...results].sort((a, b) => b.final_score - a.final_score);
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    const { data: admins } = await sb.from("profiles").select("user_id,nome,cargo")
      .or("cargo.eq.master,cargo.eq.admin,cargo.eq.supervisor")
      .eq("ativo", true).not("user_id", "is", null);
    const recipients = (admins ?? []).filter((a: any) => {
      const n = (a.nome ?? "").toLowerCase();
      return a.cargo === "master" || a.cargo === "admin" || n.includes("roberto") || n.includes("guga");
    });
    for (const r of recipients) {
      await sb.from("notification_events").insert({
        type: "manager_score_top_bottom",
        title: "Score do mês: Top & Bottom",
        body: `🥇 ${top.nome} (${top.final_score.toFixed(1)})  ·  ⚠️ ${bottom.nome} (${bottom.final_score.toFixed(1)})`,
        recipient_user_id: r.user_id,
        payload: { year: refYear, month: refMonth, top, bottom },
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, year: refYear, month: refMonth, dry_run: dryRun, count: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
