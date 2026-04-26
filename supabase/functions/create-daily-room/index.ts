import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

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
    const type = typeof body.type === "string" ? body.type : "diaria";
    const name = `curio-diaria-${meetingId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 64);
    console.log("[Daily.co] create-daily-room payload", { meetingId, title, type, name });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (SUPABASE_URL && SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      await supabase.from("leadership_meetings").update({ status: "encerrada", ended_at: new Date().toISOString() }).eq("type", type).eq("status", "em_andamento").neq("id", meetingId);
    }

    const roomPayload = {
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
    };

    let response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(roomPayload),
    });
    console.log("[Daily.co] create room status", response.status);

    if (!response.ok && response.status !== 409) {
      const details = await response.text();
      console.error("[Daily.co] create room error", details);
      if (details.toLowerCase().includes("start_cloud_recording")) {
        const retryPayload = { ...roomPayload, properties: { ...roomPayload.properties } };
        delete (retryPayload.properties as Record<string, unknown>).start_cloud_recording;
        response = await fetch("https://api.daily.co/v1/rooms", {
          method: "POST",
          headers: { Authorization: `Bearer ${DAILY_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(retryPayload),
        });
        console.log("[Daily.co] retry without start_cloud_recording status", response.status);
        if (response.ok || response.status === 409) {
          const room = response.status === 409
            ? await (await fetch(`https://api.daily.co/v1/rooms/${name}`, { headers: { Authorization: `Bearer ${DAILY_API_KEY}` } })).json()
            : await response.json();
          return new Response(JSON.stringify({ url: room.url, name: room.name, title, recording_warning: "A Daily.co rejeitou start_cloud_recording; sala criada, mas a gravação automática pode precisar ser iniciada no painel Daily.co." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
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