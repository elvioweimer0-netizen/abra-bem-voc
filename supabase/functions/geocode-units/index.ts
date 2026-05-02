import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UA = "ConectaCurioApp/1.0 contato@supermercadocurio.com";

async function geocode(address: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json" } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: units, error } = await supabase
      .from("units")
      .select("id, code, name, address, latitude, longitude")
      .or("latitude.is.null,longitude.is.null");

    if (error) throw error;

    const results: Array<{ code: string; status: string; lat?: number; lon?: number; address?: string; error?: string }> = [];
    let success = 0;
    let failed = 0;

    for (const u of units ?? []) {
      const addr = (u as any).address as string | null;
      if (!addr) {
        failed++;
        results.push({ code: u.code, status: "skipped_no_address" });
        continue;
      }
      try {
        const geo = await geocode(addr);
        if (!geo) {
          failed++;
          results.push({ code: u.code, status: "not_found", address: addr });
        } else {
          const { error: upErr } = await supabase
            .from("units")
            .update({ latitude: geo.lat, longitude: geo.lon })
            .eq("id", u.id);
          if (upErr) {
            failed++;
            results.push({ code: u.code, status: "update_error", error: upErr.message });
          } else {
            success++;
            results.push({ code: u.code, status: "ok", lat: geo.lat, lon: geo.lon, address: addr });
          }
        }
      } catch (e) {
        failed++;
        results.push({ code: u.code, status: "exception", error: (e as Error).message });
      }
      await sleep(1100); // Nominatim policy: 1 req/sec
    }

    return new Response(
      JSON.stringify({ success, failed, total: (units ?? []).length, results }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
