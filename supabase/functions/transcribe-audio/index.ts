import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY não configurada" }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "missing auth" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) return json({ error: "esperado multipart/form-data" }, 400);

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "arquivo ausente" }, 400);
    if (file.size > 25 * 1024 * 1024) return json({ error: "arquivo > 25MB (limite Whisper)" }, 413);

    const ws = new FormData();
    ws.append("model", "whisper-1");
    ws.append("language", "pt");
    ws.append("file", file, file.name || "audio.webm");

    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: ws,
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("whisper err", r.status, t);
      return json({ error: `Falha na transcrição (${r.status})` }, 502);
    }
    const data = await r.json();
    return json({ text: String(data.text ?? "").trim() });
  } catch (e) {
    console.error("transcribe-audio fatal", e);
    return json({ error: e instanceof Error ? e.message : "erro" }, 500);
  }
});
