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
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await supabase
      .from("stories")
      .select("id, media_url")
      .lt("expires_at", cutoff);
    if (error) throw error;

    let deleted_files = 0;
    if (rows && rows.length) {
      const paths = rows.map((r) => r.media_url);
      const { data: removed } = await supabase.storage.from("stories").remove(paths);
      deleted_files = removed?.length ?? 0;

      const { error: delErr } = await supabase
        .from("stories")
        .delete()
        .in("id", rows.map((r) => r.id));
      if (delErr) throw delErr;
    }

    return new Response(
      JSON.stringify({ deleted_rows: rows?.length ?? 0, deleted_files }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
