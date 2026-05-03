// Daily Huddle reminders — chamado por cron (pg_cron + pg_net).
// 9:25 BRT (seg/qua/qui/sex): lembrete pra líderes registrarem o Daily 9:30.
// 10:00 BRT (seg-sex): alerta pra Roberto/Guga/admins com unidades pendentes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key);

  // mode opcional via body { mode: "pre" | "pending" }
  let mode: "pre" | "pending" | "auto" = "auto";
  try {
    const body = await req.json();
    if (body?.mode === "pre" || body?.mode === "pending") mode = body.mode;
  } catch (_) { /* sem body */ }

  // Hora atual em America/Fortaleza
  const nowBRT = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Fortaleza" }));
  const hour = nowBRT.getHours();
  const minute = nowBRT.getMinutes();
  if (mode === "auto") {
    if (hour === 9 && minute < 45) mode = "pre";
    else if (hour === 10) mode = "pending";
    else mode = "pre";
  }

  const today = nowBRT.toISOString().slice(0, 10);
  const created: number = await (async () => {
    if (mode === "pre") {
      // Notifica todos os líderes de unidades de loja
      const { data: units } = await sb.from("units").select("id, name, type");
      const lojaUnits = (units ?? []).filter((u: any) => (u.type ?? "").toLowerCase() !== "central");
      const unitIds = lojaUnits.map((u: any) => u.id);
      if (!unitIds.length) return 0;

      const { data: leaders } = await sb
        .from("profiles")
        .select("user_id, cargo, unit_id, ativo")
        .in("unit_id", unitIds)
        .eq("ativo", true)
        .in("cargo", ["gerente", "gerente_loja", "encarregado", "lider_setor", "supervisor"]);

      const events = (leaders ?? [])
        .filter((p: any) => p.user_id)
        .map((p: any) => ({
          type: "daily_huddle_reminder",
          recipient_user_id: p.user_id,
          unit_id: p.unit_id,
          title: "Daily 9:30 chegando",
          body: "📋 Registre o BO do dia no Daily Huddle.",
          payload: { phase: "pre" },
        }));
      if (!events.length) return 0;
      const { error } = await sb.from("notification_events").insert(events);
      if (error) console.error(error);
      return events.length;
    }

    // mode === "pending"
    const { data: filled } = await sb
      .from("daily_huddle_reports")
      .select("unit_id")
      .eq("report_date", today);
    const filledSet = new Set((filled ?? []).map((r: any) => r.unit_id));

    const { data: units } = await sb.from("units").select("id, name, type");
    const lojaUnits = (units ?? []).filter((u: any) => (u.type ?? "").toLowerCase() !== "central");
    const pending = lojaUnits.filter((u: any) => !filledSet.has(u.id));
    if (!pending.length) return 0;

    const pendingNames = pending.map((u: any) => u.name).join(", ");

    // Roberto / Guga / admins / masters
    const { data: profiles } = await sb
      .from("profiles")
      .select("user_id, nome, ativo")
      .eq("ativo", true);

    const { data: roles } = await sb.from("user_roles").select("user_id, role");
    const adminIds = new Set((roles ?? []).filter((r: any) => r.role === "admin" || r.role === "master").map((r: any) => r.user_id));

    const targets = (profiles ?? []).filter((p: any) => {
      if (!p.user_id) return false;
      const n = (p.nome ?? "").toLowerCase();
      return n.includes("roberto") || n.includes("guga") || adminIds.has(p.user_id);
    });

    const events = targets.map((p: any) => ({
      type: "daily_huddle_pending",
      recipient_user_id: p.user_id,
      title: `Daily pendente em ${pending.length} unidade(s)`,
      body: `🚨 Sem registro: ${pendingNames}`,
      payload: { units: pending.map((u: any) => u.id) },
    }));
    if (!events.length) return 0;
    const { error } = await sb.from("notification_events").insert(events);
    if (error) console.error(error);
    return events.length;
  })();

  return new Response(JSON.stringify({ ok: true, mode, created }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
