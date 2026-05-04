// Lembrete de investigação para incidentes de segurança >7 dias com status='aberto'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: stale, error } = await supabase
      .from("safety_incidents")
      .select("id, unit_id, severity, incident_type, occurred_at")
      .eq("status", "aberto")
      .lte("occurred_at", sevenDaysAgo.toISOString());

    if (error) throw error;

    let reminders = 0;

    for (const inc of stale ?? []) {
      // Buscar gerentes da unidade
      const { data: managers } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("unit_id", inc.unit_id)
        .eq("ativo", true)
        .not("user_id", "is", null);

      for (const m of managers ?? []) {
        const isMgr = await supabase.rpc("is_unit_manager", {
          _user_id: m.user_id, _unit_id: inc.unit_id,
        });
        if (!isMgr.data) continue;

        await supabase.from("notification_events").insert({
          type: "high_occurrence",
          recipient_user_id: m.user_id,
          unit_id: inc.unit_id,
          title: "Incidente sem investigação há 7+ dias",
          body: `Incidente ${inc.severity} (${inc.incident_type}) ainda está aberto. Investigue.`,
          payload: { incident_id: inc.id, severity: inc.severity },
          grouping_key: `safety_stale:${inc.id}:${new Date().toISOString().slice(0, 10)}`,
        });
        reminders++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, stale_count: stale?.length ?? 0, reminders }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
