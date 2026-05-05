import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

// Sends daily push digest to master/admin users at 7:30 weekdays via cron.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yISO = yesterday.toISOString().slice(0, 10);

    const { data: snaps } = await supabase
      .from("master_snapshots")
      .select("kpis, alerts")
      .eq("snapshot_date", yISO);

    let okCount = 0;
    let alertsCount = 0;
    (snaps ?? []).forEach((s: any) => {
      const status = s.kpis?.status;
      if (status === "ok" || status === "verde") okCount++;
      const alerts = Array.isArray(s.alerts) ? s.alerts.length : 0;
      alertsCount += alerts;
    });

    const { count: pending } = await supabase
      .from("master_pending_decisions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pendente");

    const message = `Sua rede hoje: ${okCount} de 7 unidades OK, ${alertsCount} alertas, ${pending ?? 0} decisões esperando você`;

    const { data: admins } = await supabase
      .from("profiles")
      .select("user_id, nome")
      .in("cargo", ["master", "admin"])
      .eq("ativo", true);

    let notified = 0;
    for (const a of admins ?? []) {
      try {
        await supabase.from("notification_events").insert({
          recipient_user_id: a.user_id,
          title: "Resumo diário da rede",
          body: message,
          type: "master_digest",
          payload: { link: "/" },
        });
        notified++;
      } catch { /* ignore single failures */ }
    }

    return new Response(JSON.stringify({ ok: true, message, notified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
