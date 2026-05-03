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

    const leaderRoles = ["admin", "supervisor", "gerente", "gerente_loja", "gerente_adm", "encarregado"];

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, nome, unit_id, cargo")
      .eq("ativo", true)
      .in("cargo", leaderRoles)
      .not("user_id", "is", null);

    if (error) throw error;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: started } = await supabase
      .from("day_starts")
      .select("user_id")
      .gte("started_at", today.toISOString());

    const startedSet = new Set((started ?? []).map((s: any) => s.user_id));
    const targets = (profiles ?? []).filter((p: any) => !startedSet.has(p.user_id));

    let inserted = 0;
    for (const p of targets) {
      const { error: insErr } = await supabase.from("notification_events").insert({
        type: "day_start_reminder",
        recipient_user_id: p.user_id,
        unit_id: p.unit_id,
        title: "Bom dia! 🌅",
        body: "Toque pra iniciar seu dia e ver o briefing da loja.",
        payload: {},
      });
      if (!insErr) inserted++;
    }

    return new Response(JSON.stringify({ ok: true, inserted, total: targets.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
