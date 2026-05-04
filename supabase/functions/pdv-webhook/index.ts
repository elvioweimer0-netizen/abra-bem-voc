// Stub para integração futura com sistema de PDV.
// Aceita POST com payload { unit_id, date, hour?, revenue, transactions, secret }.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PDV_WEBHOOK_SECRET = Deno.env.get("PDV_WEBHOOK_SECRET");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (PDV_WEBHOOK_SECRET && body?.secret !== PDV_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: "invalid secret" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { unit_id, date, hour, revenue, transactions } = body ?? {};
    if (!unit_id || !date || revenue == null) {
      return new Response(JSON.stringify({ error: "unit_id, date, revenue obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    await admin
      .from("sales_metrics")
      .delete()
      .eq("unit_id", unit_id)
      .eq("metric_date", date)
      .filter("metric_hour", hour == null ? "is" : "eq", hour ?? (null as any));
    const { error } = await admin.from("sales_metrics").insert({
      unit_id,
      metric_date: date,
      metric_hour: hour ?? null,
      revenue: Number(revenue),
      transactions: Number(transactions ?? 0),
      source: "integracao_pdv",
    });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
