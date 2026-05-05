import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

// Computes daily snapshots for each unit (called by cron at 04:30).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const { data: units } = await supabase.from("units").select("id, name");
    const results: any[] = [];

    for (const u of units ?? []) {
      const { data: salesArr } = await supabase
        .from("sales_metrics")
        .select("revenue")
        .eq("unit_id", u.id)
        .eq("metric_date", yesterday);
      const revenue = (salesArr ?? []).reduce((a: number, r: any) => a + Number(r.revenue || 0), 0);

      const { count: incidents } = await supabase
        .from("safety_incidents")
        .select("id", { count: "exact", head: true })
        .eq("unit_id", u.id)
        .gte("created_at", `${yesterday}T00:00:00`)
        .lte("created_at", `${yesterday}T23:59:59`);

      const { count: missing } = await supabase
        .from("missing_product_requests")
        .select("id", { count: "exact", head: true })
        .eq("unit_id", u.id)
        .gte("created_at", `${yesterday}T00:00:00`)
        .lte("created_at", `${yesterday}T23:59:59`);

      const alerts: string[] = [];
      if ((incidents ?? 0) > 0) alerts.push(`${incidents} incidentes`);
      if ((missing ?? 0) > 5) alerts.push(`Ruptura alta`);

      const status = alerts.length === 0 ? "verde" : alerts.length === 1 ? "amarelo" : "vermelho";

      const payload = {
        unit_id: u.id,
        snapshot_date: today,
        kpis: {
          revenue,
          incidents: incidents ?? 0,
          missing: missing ?? 0,
          status,
        },
        alerts,
        top_movers: [],
      };
      results.push(payload);
    }

    if (results.length) {
      // Upsert by (snapshot_date, unit_id) — table doesn't enforce uniqueness here, simply insert.
      await supabase.from("master_snapshots").insert(
        results.map((r) => ({
          snapshot_date: r.snapshot_date,
          kpis: { ...r.kpis, unit_id: r.unit_id },
          alerts: r.alerts,
          top_movers: r.top_movers,
        })),
      );
    }

    return new Response(JSON.stringify({ ok: true, count: results.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
