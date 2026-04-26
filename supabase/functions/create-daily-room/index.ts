import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY");
    if (!DAILY_API_KEY) {
      return new Response(JSON.stringify({ error: "DAILY_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const meetingId = typeof body.meetingId === "string" ? body.meetingId : crypto.randomUUID();
    const title = typeof body.title === "string" ? body.title : "Reunião Diária";
    const name = `curio-diaria-${meetingId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 64);

    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        privacy: "public",
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: "cloud",
          start_cloud_recording: true,
          eject_at_room_exp: true,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6,
        },
      }),
    });

    if (!response.ok && response.status !== 409) {
      const details = await response.text();
      const isPlanError = response.status === 402 || details.toLowerCase().includes("recording") || details.toLowerCase().includes("plan");
      return new Response(JSON.stringify({
        error: isPlanError ? "Plano Daily.co não suporta gravação. Faça upgrade pra Pay-as-you-go." : "Erro ao criar sala Daily.co",
        plan_error: isPlanError,
        details,
      }), {
        status: isPlanError ? 200 : response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (response.status === 409) {
      const existing = await fetch(`https://api.daily.co/v1/rooms/${name}`, {
        headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
      });
      const room = await existing.json();
      return new Response(JSON.stringify({ url: room.url, name: room.name, title }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const room = await response.json();
    return new Response(JSON.stringify({ url: room.url, name: room.name, title }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});