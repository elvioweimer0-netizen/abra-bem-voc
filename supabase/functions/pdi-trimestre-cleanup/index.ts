import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date();
  // Compute previous quarter
  const month = now.getMonth(); // 0-11
  const currQ = Math.floor(month / 3) + 1;
  const prevQ = currQ === 1 ? 4 : currQ - 1;
  const prevAno = currQ === 1 ? now.getFullYear() - 1 : now.getFullYear();

  const { data: goals, error } = await supabase
    .from("pdi_goals")
    .select("id, titulo, gerente_user_id, encarregado_user_id, unit_id")
    .eq("status", "em_andamento")
    .eq("trimestre", prevQ)
    .eq("ano", prevAno);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  let notified = 0;
  for (const g of goals ?? []) {
    if (!g.gerente_user_id) continue;
    await supabase.from("notification_events").insert({
      type: "pdi_overdue_goal",
      recipient_user_id: g.gerente_user_id,
      unit_id: g.unit_id,
      title: "Meta de PDI pendente",
      body: `O trimestre acabou e a meta "${g.titulo}" segue em andamento.`,
      payload: { goal_id: g.id, encarregado_user_id: g.encarregado_user_id },
    });
    notified++;
  }

  return new Response(JSON.stringify({ notified, prevQ, prevAno }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
