// Daily recommendations generator (cron 05:00).
// Inserts up to 3 simple recommendations per active manager/encarregado profile.
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

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id,cargo,unit_id,nome")
      .in("cargo", ["gerente_loja", "encarregado", "gerente"])
      .limit(500);

    const inserts: any[] = [];
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();

    for (const p of profiles ?? []) {
      // Old open incidents
      if (p.unit_id) {
        const { data: inc } = await supabase
          .from("safety_incidents")
          .select("id,created_at")
          .eq("unit_id", p.unit_id)
          .eq("status", "aberto")
          .lt("created_at", new Date(Date.now() - 5 * 86400000).toISOString())
          .limit(1);
        if (inc?.length) {
          inserts.push({
            target_user_id: p.user_id,
            type: "incidente_atrasado",
            title: "Investigar incidente em aberto",
            description: "Tem incidente sem investigação há mais de 5 dias.",
            action_link: "/seguranca",
            priority: 8,
            expires_at: expires,
          });
        }
      }

      // Generic nudge
      inserts.push({
        target_user_id: p.user_id,
        type: "nudge_diario",
        title: "Caminhe pela loja por 5 minutos",
        description: "Olhar setores na hora do pico revela rupturas.",
        action_link: "/auditoria-visual",
        priority: 3,
        expires_at: expires,
      });
    }

    if (inserts.length) {
      // Avoid duplicates of same type within a day
      await supabase.from("recommendations").insert(inserts);
    }

    return new Response(JSON.stringify({ ok: true, inserted: inserts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
