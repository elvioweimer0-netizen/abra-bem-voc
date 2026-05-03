import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: units } = await supabase.from("units").select("id, name, code");
    let created = 0;

    // Per-unit groups
    for (const u of units ?? []) {
      const name = `Loja ${u.name}`;
      const { data: existing } = await supabase.from("chat_conversations").select("id").eq("type", "unit_auto").eq("unit_id", u.id).maybeSingle();
      let convId = existing?.id;
      if (!convId) {
        const { data: ins } = await supabase.from("chat_conversations").insert({ type: "unit_auto", name, unit_id: u.id }).select("id").single();
        convId = ins?.id; created++;
      }
      const { data: profs } = await supabase.from("profiles").select("user_id").eq("unit_id", u.id).eq("ativo", true);
      const rows = (profs ?? []).filter((p: any) => p.user_id).map((p: any) => ({ conversation_id: convId, user_id: p.user_id, role: "member" }));
      if (rows.length) await supabase.from("chat_participants").upsert(rows, { onConflict: "conversation_id,user_id", ignoreDuplicates: true });
    }

    // Channel global "Avisos Curió"
    const { data: ch } = await supabase.from("chat_conversations").select("id").eq("type", "channel").eq("name", "Avisos Curió").maybeSingle();
    let chId = ch?.id;
    if (!chId) {
      const { data: ins } = await supabase.from("chat_conversations").insert({ type: "channel", name: "Avisos Curió" }).select("id").single();
      chId = ins?.id; created++;
    }
    const { data: allProfs } = await supabase.from("profiles").select("user_id").eq("ativo", true);
    const allRows = (allProfs ?? []).filter((p: any) => p.user_id).map((p: any) => ({ conversation_id: chId, user_id: p.user_id, role: "member" }));
    if (allRows.length) await supabase.from("chat_participants").upsert(allRows, { onConflict: "conversation_id,user_id", ignoreDuplicates: true });

    return new Response(JSON.stringify({ ok: true, created, units: units?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
