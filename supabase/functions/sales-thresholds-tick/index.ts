// Cron horário: notifica metas batidas e padrões preocupantes
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  try {
    const today = new Date().toISOString().slice(0, 10);
    const y = parseInt(today.slice(0, 4), 10);
    const m = parseInt(today.slice(5, 7), 10);
    const dim = new Date(y, m, 0).getDate();

    const { data: targets } = await admin
      .from("sales_targets")
      .select("unit_id, target_revenue")
      .eq("year", y)
      .eq("month", m);

    const targetsByUnit = new Map<string, number>();
    for (const t of targets ?? []) targetsByUnit.set(t.unit_id, Number(t.target_revenue) || 0);

    const stats = { goal_hit: 0, warning: 0 };

    for (const [unitId, monthTarget] of targetsByUnit.entries()) {
      const dailyTarget = dim > 0 ? monthTarget / dim : 0;
      if (dailyTarget <= 0) continue;

      // hoje
      const { data: todayRows } = await admin
        .from("sales_metrics")
        .select("revenue")
        .eq("unit_id", unitId)
        .eq("metric_date", today);
      const todayRev = (todayRows ?? []).reduce((s, r) => s + Number(r.revenue), 0);

      // 100% goal hit (idempotente via grouping_key)
      if (todayRev >= dailyTarget && dailyTarget > 0) {
        const groupingKey = `sales_goal_hit:${unitId}:${today}`;
        const { data: managers } = await admin
          .from("profiles")
          .select("user_id")
          .eq("unit_id", unitId)
          .eq("ativo", true)
          .in("cargo", ["gerente", "gerente_loja"]);
        for (const mgr of managers ?? []) {
          if (!mgr.user_id) continue;
          await admin.from("notification_events").insert({
            type: "high_occurrence",
            recipient_user_id: mgr.user_id,
            unit_id: unitId,
            title: "Meta diária batida 🎯",
            body: `Sua loja atingiu R$ ${todayRev.toFixed(2)} (meta diária R$ ${dailyTarget.toFixed(2)}).`,
            payload: { unit_id: unitId, date: today, revenue: todayRev, target: dailyTarget },
            grouping_key: groupingKey,
          });
        }
        stats.goal_hit++;
      }

      // últimos 3 dias < 80%
      const last3: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last3.push(d.toISOString().slice(0, 10));
      }
      const { data: last3Rows } = await admin
        .from("sales_metrics")
        .select("metric_date, revenue")
        .eq("unit_id", unitId)
        .in("metric_date", last3);
      const byDate = new Map<string, number>();
      for (const r of last3Rows ?? []) {
        byDate.set(r.metric_date, (byDate.get(r.metric_date) ?? 0) + Number(r.revenue));
      }
      const allLow = last3.every((d) => (byDate.get(d) ?? 0) < dailyTarget * 0.8);
      if (allLow) {
        const groupingKey = `sales_3d_low:${unitId}:${today}`;
        const { data: leaders } = await admin
          .from("profiles")
          .select("user_id, nome, cargo")
          .eq("ativo", true);
        const targets = (leaders ?? []).filter((p) =>
          p.user_id && (
            p.cargo === "admin" || p.cargo === "master"
            || /roberto|guga/i.test(p.nome ?? "")
          )
        );
        for (const t of targets) {
          await admin.from("notification_events").insert({
            type: "high_occurrence",
            recipient_user_id: t.user_id!,
            unit_id: unitId,
            title: "Vendas abaixo da meta há 3 dias",
            body: `Unidade está abaixo de 80% da meta diária por 3 dias seguidos.`,
            payload: { unit_id: unitId, last3, target_daily: dailyTarget },
            grouping_key: groupingKey,
          });
        }
        stats.warning++;
      }
    }

    return new Response(JSON.stringify({ ok: true, ...stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[sales-thresholds-tick]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
