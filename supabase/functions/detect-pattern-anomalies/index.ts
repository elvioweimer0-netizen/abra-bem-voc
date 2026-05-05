import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

// Detects pattern anomalies across the network and inserts pending decisions for masters.
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

    // 1) Ruptura subindo em 3+ unidades
    const { data: missing } = await supabase
      .from("missing_products")
      .select("unit_id, created_at")
      .gte("created_at", sinceISO);
    const byUnit: Record<string, number> = {};
    (missing ?? []).forEach((m: any) => { byUnit[m.unit_id] = (byUnit[m.unit_id] || 0) + 1; });
    const risingUnits = Object.entries(byUnit).filter(([, n]) => n >= 5).map(([id]) => id);
    if (risingUnits.length >= 3) {
      inserts.push({
        decision_type: "pattern_ruptura",
        priority: "alta",
        title: `Ruptura subindo em ${risingUnits.length} unidades`,
        description: `Detectado aumento de produtos faltando nos últimos 3 dias em ${risingUnits.length} unidades simultaneamente.`,
        payload: { unit_ids: risingUnits, window_days: 3 },
      });
    }

    // 2) Gerentes com 3+ quedas seguidas no score
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
          decision_type: "pattern_gerente_queda",
          priority: "alta",
          title: `Gerente com 3 quedas seguidas no score`,
          description: `Score caindo há 3 meses consecutivos.`,
          payload: { user_id: uid, scores: arr },
        });
      }
    });

    // 3) Humor caindo em multiplas unidades (wellbeing)
    try {
      const { data: well } = await supabase
        .from("wellbeing_checkins")
        .select("unit_id, mood_score, created_at")
        .gte("created_at", sinceISO);
      const moodByUnit: Record<string, number[]> = {};
      (well ?? []).forEach((w: any) => {
        if (!moodByUnit[w.unit_id]) moodByUnit[w.unit_id] = [];
        moodByUnit[w.unit_id].push(Number(w.mood_score || 0));
      });
      const lowMoodUnits = Object.entries(moodByUnit)
        .filter(([, arr]) => arr.length >= 3 && arr.reduce((a, b) => a + b, 0) / arr.length < 3)
        .map(([id]) => id);
      if (lowMoodUnits.length >= 2) {
        inserts.push({
          decision_type: "pattern_humor",
          priority: "alta",
          title: `Humor da equipe caindo em ${lowMoodUnits.length} unidades`,
          description: `Média de humor abaixo de 3 nos últimos 3 dias.`,
          payload: { unit_ids: lowMoodUnits },
        });
      }
    } catch { /* table may not exist */ }

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
