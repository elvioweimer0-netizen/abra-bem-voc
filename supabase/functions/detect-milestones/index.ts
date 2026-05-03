import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MILESTONE_YEARS: Record<number, string> = {
  1: "1_year",
  3: "3_years",
  5: "5_years",
  10: "10_years",
  20: "20_years",
};

const ACHIEVEMENT_CODES: Record<number, string> = {
  1: "veterano_1y",
  3: "veterano_3y",
  5: "veterano_5y",
  10: "veterano_10y",
  20: "veterano_20y",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let force = false;
  let forceUserId: string | null = null;
  let forceType: string | null = null;
  let forceDate: string | null = null;

  if (req.method === "POST") {
    try {
      const body = await req.json();
      force = !!body.force;
      forceUserId = body.user_id ?? null;
      forceType = body.milestone_type ?? null;
      forceDate = body.milestone_date ?? null;
    } catch {}
  }

  // For force mode, require admin auth
  if (force) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", claims.claims.sub)
      .in("role", ["admin", "master"]);
    if (!roles?.length) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Find admin author for the praise
  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role", ["master", "admin"])
    .limit(1)
    .maybeSingle();
  const authorUserId = adminRole?.user_id;

  const created: any[] = [];
  const skipped: any[] = [];
  const errors: any[] = [];

  // FORCE mode
  if (force && forceUserId && forceType && forceDate) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, nome, unit_id")
      .eq("user_id", forceUserId)
      .maybeSingle();
    if (!profile) {
      return new Response(JSON.stringify({ error: "profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const yearMatch = forceType.match(/^(\d+)_year/);
    const years = yearMatch ? Number(yearMatch[1]) : 0;
    await celebrate(supabase, profile, forceType, forceDate, years, authorUserId, created, errors);
    return new Response(JSON.stringify({ created, errors, mode: "force" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // CRON mode: scan all profiles with data_admissao
  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("user_id, nome, unit_id, data_admissao, ativo")
    .eq("ativo", true)
    .not("data_admissao", "is", null);

  if (profErr) {
    return new Response(JSON.stringify({ error: profErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  for (const p of profiles ?? []) {
    if (!p.data_admissao || !p.user_id) continue;
    const adm = new Date(p.data_admissao + "T00:00:00Z");
    // Match same month/day
    if (adm.getUTCMonth() !== today.getUTCMonth() || adm.getUTCDate() !== today.getUTCDate()) continue;
    const years = today.getUTCFullYear() - adm.getUTCFullYear();
    const milestoneType = MILESTONE_YEARS[years];
    if (!milestoneType) continue;

    await celebrate(supabase, p, milestoneType, todayStr, years, authorUserId, created, errors);
  }

  return new Response(JSON.stringify({ created, skipped, errors, scanned: profiles?.length ?? 0 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

async function celebrate(
  supabase: any,
  profile: { user_id: string; nome: string; unit_id: string | null },
  milestoneType: string,
  milestoneDate: string,
  years: number,
  authorUserId: string | undefined,
  created: any[],
  errors: any[],
) {
  // Skip if already exists
  const { data: existing } = await supabase
    .from("milestone_celebrations")
    .select("id")
    .eq("user_id", profile.user_id)
    .eq("milestone_type", milestoneType)
    .eq("milestone_date", milestoneDate)
    .maybeSingle();
  if (existing) return;

  // Find team_member for destinatario_id (praises FK)
  const { data: tm } = await supabase
    .from("team_members")
    .select("id, unit_id")
    .eq("user_id", profile.user_id)
    .limit(1)
    .maybeSingle();

  let praiseId: string | null = null;
  if (tm && authorUserId && (profile.unit_id || tm.unit_id)) {
    const message = years > 0
      ? `${profile.nome} completa ${years} ${years === 1 ? "ano" : "anos"} no Curió! Parabéns pela jornada e dedicação. 🎉`
      : `Marco especial de ${profile.nome} no Curió! Parabéns pela trajetória.`;
    const { data: praise, error: praiseErr } = await supabase
      .from("praises")
      .insert({
        autor_id: authorUserId,
        destinatario_id: tm.id,
        unit_id: profile.unit_id ?? tm.unit_id,
        motivo: message,
        categoria: "aniversario_curio",
        praise_type: "equipe_externa",
        publico: true,
      })
      .select("id")
      .single();
    if (praiseErr) {
      errors.push({ user: profile.user_id, stage: "praise", err: praiseErr.message });
    } else {
      praiseId = praise.id;
    }
  }

  const { data: mc, error: mcErr } = await supabase
    .from("milestone_celebrations")
    .insert({
      user_id: profile.user_id,
      milestone_type: milestoneType,
      milestone_date: milestoneDate,
      praise_id: praiseId,
    })
    .select("id")
    .single();

  if (mcErr) {
    errors.push({ user: profile.user_id, stage: "milestone", err: mcErr.message });
    return;
  }

  // Achievement
  const achCode = ACHIEVEMENT_CODES[years];
  if (achCode) {
    const { data: ach } = await supabase
      .from("achievements")
      .select("id")
      .eq("code", achCode)
      .maybeSingle();
    if (ach) {
      await supabase
        .from("user_achievements")
        .upsert(
          {
            user_id: profile.user_id,
            achievement_id: ach.id,
            current_progress: years,
            completed: true,
            unlocked_at: new Date().toISOString(),
          },
          { onConflict: "user_id,achievement_id" },
        );
    }
  }

  // Notifications
  const yearLabel = years > 0 ? `${years} ${years === 1 ? "ano" : "anos"} no Curió! 🎉` : `marco no Curió! 🎉`;
  await supabase.from("notification_events").insert({
    type: "milestone_anniversary",
    recipient_user_id: profile.user_id,
    unit_id: profile.unit_id,
    title: "Parabéns pela sua jornada!",
    body: `Hoje você completa ${yearLabel}`,
    payload: { milestone_id: mc.id, milestone_type: milestoneType, years },
  });

  if (profile.unit_id) {
    const { data: team } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("unit_id", profile.unit_id)
      .eq("ativo", true)
      .neq("user_id", profile.user_id);
    for (const t of team ?? []) {
      if (!t.user_id) continue;
      await supabase.from("notification_events").insert({
        type: "milestone_anniversary",
        recipient_user_id: t.user_id,
        unit_id: profile.unit_id,
        title: "Marco no Curió 🎉",
        body: `${profile.nome} completa ${yearLabel}`,
        payload: { milestone_id: mc.id, celebrated_user_id: profile.user_id, years },
      });
    }
  }

  created.push({ user: profile.user_id, milestoneType, years, praiseId });
}
