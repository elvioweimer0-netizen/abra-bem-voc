import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);
    const sinceISO = threeDaysAgo.toISOString();

    const inserts: any[] = [];

    // 1) Ruptura: 3+ unidades com aumento
    const { data: missing } = await supabase
      .from("missing_product_requests")
      .select("unit_id, created_at")
      .gte("created_at", sinceISO);
    const byUnit: Record<string, number> = {};
    (missing ?? []).forEach((m: any) => { if (m.unit_id) byUnit[m.unit_id] = (byUnit[m.unit_id] || 0) + 1; });
    const risingUnits = Object.entries(byUnit).filter(([, n]) => n >= 5).map(([id]) => id);
    if (risingUnits.length >= 3) {
      inserts.push({
        type: "pattern_ruptura",
        title: `Ruptura subindo em ${risingUnits.length} unidades`,
        description: `Aumento de produtos faltando nos últimos 3 dias em ${risingUnits.length} unidades.`,
      });
    }

    // 2) Gerentes com 3+ quedas
    const { data: scores } = await supabase
      .from("manager_scores_monthly")
      .select("user_id, month, final_score")
      .order("month", { ascending: false });
    const byMgr: Record<string, number[]> = {};
    (scores ?? []).forEach((s: any) => {
      if (!byMgr[s.user_id]) byMgr[s.user_id] = [];
      if (byMgr[s.user_id].length < 4) byMgr[s.user_id].push(Number(s.final_score));
    });
    Object.entries(byMgr).forEach(([uid, arr]) => {
      if (arr.length >= 4 && arr[0] < arr[1] && arr[1] < arr[2] && arr[2] < arr[3]) {
        inserts.push({
          type: "pattern_gerente_queda",
          ref_id: uid,
          title: `Gerente com 3 quedas seguidas no score`,
          description: `Score caindo há 3 meses consecutivos.`,
        });
      }
    });

    // 3) Humor caindo
    try {
      const { data: well } = await supabase
        .from("wellbeing_checkins")
        .select("unit_id, composite_score, created_at")
        .gte("created_at", sinceISO);
      const moodByUnit: Record<string, number[]> = {};
      (well ?? []).forEach((w: any) => {
        if (!w.unit_id) return;
        if (!moodByUnit[w.unit_id]) moodByUnit[w.unit_id] = [];
        moodByUnit[w.unit_id].push(Number(w.composite_score || 0));
      });
      const lowMoodUnits = Object.entries(moodByUnit)
        .filter(([, arr]) => arr.length >= 3 && arr.reduce((a, b) => a + b, 0) / arr.length < 3)
        .map(([id]) => id);
      if (lowMoodUnits.length >= 2) {
        inserts.push({
          type: "pattern_humor",
          title: `Humor da equipe caindo em ${lowMoodUnits.length} unidades`,
          description: `Média de humor abaixo de 3 nos últimos 3 dias.`,
        });
      }
    } catch { /* ignore */ }

    let inserted = 0;
    if (inserts.length) {
      const { error } = await supabase.from("master_pending_decisions").insert(inserts);
      if (!error) inserted = inserts.length;
    }

    return new Response(JSON.stringify({ ok: true, inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
