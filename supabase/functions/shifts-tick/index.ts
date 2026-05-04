import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const now = new Date();
    const startWindow = new Date(now.getTime() + 55 * 60 * 1000);
    const endWindow = new Date(now.getTime() + 65 * 60 * 1000);
    const dateStr = startWindow.toISOString().slice(0, 10);
    const startHHMM = startWindow.toISOString().slice(11, 19);
    const endHHMM = endWindow.toISOString().slice(11, 19);

    const { data: shifts, error } = await supabase
      .from("shifts")
      .select("id, user_id, unit_id, shift_date, shift_start, setor")
      .eq("shift_date", dateStr)
      .gte("shift_start", startHHMM)
      .lte("shift_start", endHHMM)
      .is("reminded_at", null)
      .eq("status", "agendado");

    if (error) throw error;

    let count = 0;
    for (const s of shifts ?? []) {
      await supabase.from("notification_events").insert({
        type: "shift_reminder",
        recipient_user_id: s.user_id,
        unit_id: s.unit_id,
        title: "Seu turno começa em 1h ⏰",
        body: `Turno às ${(s.shift_start as string).slice(0, 5)}${s.setor ? ` em ${s.setor}` : ""}`,
        payload: { shift_id: s.id },
      });
      await supabase.from("shifts").update({ reminded_at: new Date().toISOString() }).eq("id", s.id);
      count++;
    }

    return new Response(JSON.stringify({ ok: true, reminded: count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
