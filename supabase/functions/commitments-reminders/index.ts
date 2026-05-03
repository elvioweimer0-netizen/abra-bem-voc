// Compromissos da semana — lembretes via cron.
// modes: declare (seg 8:30), late (ter 9:00), evaluate (sex 16:00).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VIEWER_ROLES = ["admin","master","supervisor","gerente","gerente_loja","gerente_adm","encarregado","fiscal","lider_setor"];

function getMondayBRT(): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Fortaleza" }));
  const d = new Date(now);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let mode: "declare" | "late" | "evaluate" = "declare";
  try { const b = await req.json(); if (b?.mode) mode = b.mode; } catch (_) {}

  const week = getMondayBRT();

  // Quem é viewer (também quem deve declarar)
  const { data: roles } = await sb.from("user_roles").select("user_id, role").in("role", VIEWER_ROLES);
  const viewerIds = Array.from(new Set((roles ?? []).map((r: any) => r.user_id).filter(Boolean)));
  if (!viewerIds.length) return new Response(JSON.stringify({ ok: true, created: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { data: profiles } = await sb
    .from("profiles")
    .select("user_id, unit_id, ativo")
    .in("user_id", viewerIds)
    .eq("ativo", true);
  const activeIds = (profiles ?? []).filter((p: any) => p.user_id).map((p: any) => p.user_id);
  if (!activeIds.length) return new Response(JSON.stringify({ ok: true, created: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { data: weekRows } = await sb
    .from("weekly_commitments")
    .select("user_id, evaluated_at")
    .eq("week_start_date", week)
    .in("user_id", activeIds);

  const declaredSet = new Set((weekRows ?? []).map((r: any) => r.user_id));
  const evaluatedByUser = new Map<string, boolean>();
  (weekRows ?? []).forEach((r: any) => {
    const prev = evaluatedByUser.get(r.user_id);
    const evald = !!r.evaluated_at;
    evaluatedByUser.set(r.user_id, prev === undefined ? evald : prev && evald);
  });

  let targets: string[] = [];
  let title = "", body = "", type = "";

  if (mode === "declare") {
    targets = activeIds.filter((id: string) => !declaredSet.has(id));
    title = "Declare seus compromissos";
    body = "🎯 Publique até 3 compromissos da semana.";
    type = "commitment_declare";
  } else if (mode === "late") {
    targets = activeIds.filter((id: string) => !declaredSet.has(id));
    title = "Compromissos pendentes";
    body = "⚠️ Você ainda não declarou seus compromissos da semana.";
    type = "commitment_late";
  } else {
    targets = activeIds.filter((id: string) => declaredSet.has(id) && !evaluatedByUser.get(id));
    title = "Avalie seus compromissos";
    body = "✅ Sexta-feira: registre o resultado dos seus compromissos.";
    type = "commitment_evaluate";
  }

  if (!targets.length) return new Response(JSON.stringify({ ok: true, created: 0, mode }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const events = targets.map((uid) => ({
    type, recipient_user_id: uid, title, body, payload: { week_start_date: week },
  }));
  const { error } = await sb.from("notification_events").insert(events);
  if (error) console.error(error);

  return new Response(JSON.stringify({ ok: true, mode, created: events.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
