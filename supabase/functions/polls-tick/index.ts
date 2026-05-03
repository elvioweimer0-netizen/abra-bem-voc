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

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 60_000);

  // 1) Encerrar polls expiradas
  const { data: toClose } = await supabase
    .from("polls")
    .select("id, author_user_id, question")
    .eq("status", "ativa")
    .lt("expires_at", now.toISOString());

  for (const p of toClose ?? []) {
    await supabase.from("polls").update({ status: "encerrada" }).eq("id", p.id);
    await supabase.from("notification_events").insert({
      type: "poll_closed",
      recipient_user_id: p.author_user_id,
      title: "Enquete encerrada",
      body: `Sua enquete "${p.question}" foi encerrada. Veja os resultados.`,
      payload: { poll_id: p.id },
    });
  }

  // 2) Avisar autor 30min antes
  const { data: nearEnd } = await supabase
    .from("polls")
    .select("id, author_user_id, question, expires_at")
    .eq("status", "ativa")
    .eq("notified_30min", false)
    .lt("expires_at", in30.toISOString())
    .gt("expires_at", now.toISOString());

  for (const p of nearEnd ?? []) {
    await supabase.from("polls").update({ notified_30min: true }).eq("id", p.id);
    await supabase.from("notification_events").insert({
      type: "poll_closing_soon",
      recipient_user_id: p.author_user_id,
      title: "Enquete encerra em 30min",
      body: `Sua enquete "${p.question}" termina em breve.`,
      payload: { poll_id: p.id },
    });
  }

  return new Response(
    JSON.stringify({ closed: toClose?.length ?? 0, warned: nearEnd?.length ?? 0 }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
