// Importa CSV de vendas de uma unidade
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const parts = line.split(/[,;]/).map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = parts[i] ?? ""));
    return row;
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const unitId = body?.unit_id as string | undefined;
    const csvText = body?.csv_text as string | undefined;
    if (!unitId || !csvText) {
      return new Response(JSON.stringify({ error: "unit_id e csv_text obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    // autoriza: gerente da unit OU admin/master
    const { data: roleAdm } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    const { data: roleMst } = await admin.rpc("has_role", { _user_id: userId, _role: "master" });
    const { data: isMgr } = await admin.rpc("is_unit_manager", { _user_id: userId, _unit_id: unitId });
    if (!roleAdm && !roleMst && !isMgr) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = parseCsv(csvText);
    if (!rows.length) {
      return new Response(JSON.stringify({ error: "CSV vazio. Cabeçalho esperado: date,hour,revenue,transactions" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const records = rows
      .map((r) => {
        const date = r["date"] || r["data"];
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
        const hourStr = r["hour"] || r["hora"] || "";
        const hour = hourStr === "" ? null : Math.max(0, Math.min(23, parseInt(hourStr, 10)));
        const revenue = Number((r["revenue"] || r["receita"] || "0").replace(",", "."));
        const transactions = parseInt(r["transactions"] || r["transacoes"] || "0", 10) || 0;
        if (isNaN(revenue) || revenue < 0) return null;
        return {
          unit_id: unitId,
          metric_date: date,
          metric_hour: isNaN(hour as number) ? null : hour,
          revenue,
          transactions,
          source: "planilha",
          created_by: userId,
        };
      })
      .filter(Boolean) as any[];

    if (!records.length) {
      return new Response(JSON.stringify({ error: "Nenhuma linha válida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // upsert via delete-then-insert para respeitar índice único composto
    let inserted = 0;
    for (const rec of records) {
      await admin
        .from("sales_metrics")
        .delete()
        .eq("unit_id", rec.unit_id)
        .eq("metric_date", rec.metric_date)
        .filter("metric_hour", rec.metric_hour === null ? "is" : "eq", rec.metric_hour as any);
      const { error } = await admin.from("sales_metrics").insert(rec);
      if (!error) inserted++;
      else console.error("[import-sales-csv] insert error", error);
    }

    return new Response(JSON.stringify({ ok: true, inserted, total: records.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[import-sales-csv]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
