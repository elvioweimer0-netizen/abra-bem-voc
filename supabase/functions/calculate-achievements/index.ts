// Calculate achievements progress and unlock badges. Designed for daily cron.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type Achievement = {
  id: string;
  code: string;
  criteria_type: string;
  criteria_target: number | null;
  criteria_metric: string;
  role_filter: string[] | null;
};

type Profile = {
  user_id: string;
  cargo: string;
  unit_id: string | null;
  data_admissao: string | null;
};

// Safe wrapper: return null if any error (table missing, etc.)
async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (_e) {
    return null;
  }
}

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

// Compute current consecutive day streak ending today from a set of date strings (YYYY-MM-DD)
function computeStreak(dates: Set<string>): number {
  let streak = 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  // allow start either today or yesterday
  const cursor = new Date(today);
  if (!dates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!dates.has(cursor.toISOString().slice(0, 10))) return 0;
  }
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

async function metricValue(metric: string, profile: Profile): Promise<number | null> {
  const uid = profile.user_id;
  switch (metric) {
    case "daily_huddle_count": {
      const r = await safe(() => supabase.from("daily_huddle_reports").select("id", { count: "exact", head: true }).eq("author_user_id", uid));
      return r?.count ?? null;
    }
    case "daily_huddle_streak": {
      const r = await safe(() => supabase.from("daily_huddle_reports").select("report_date").eq("author_user_id", uid).order("report_date", { ascending: false }).limit(120));
      if (!r?.data) return null;
      const set = new Set<string>(r.data.map((x: any) => x.report_date as string));
      return computeStreak(set);
    }
    case "aviso_reads_count": {
      const r = await safe(() => supabase.from("aviso_reads").select("id", { count: "exact", head: true }).eq("user_id", uid));
      return r?.count ?? null;
    }
    case "aviso_reads_streak_4w": {
      // Count weeks (last N) where user read at least one aviso
      const r = await safe(() => supabase.from("aviso_reads").select("read_at").eq("user_id", uid).order("read_at", { ascending: false }).limit(200));
      if (!r?.data) return null;
      const weeks = new Set<string>();
      for (const row of r.data as any[]) {
        const d = new Date(row.read_at);
        const onejan = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const wk = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getUTCDay() + 1) / 7);
        weeks.add(`${d.getUTCFullYear()}-${wk}`);
      }
      // Streak of consecutive weeks ending this week
      const today = new Date();
      let streak = 0;
      for (let i = 0; i < 12; i++) {
        const d = new Date(today.getTime() - i * 7 * 86400000);
        const onejan = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const wk = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getUTCDay() + 1) / 7);
        if (weeks.has(`${d.getUTCFullYear()}-${wk}`)) streak++; else break;
      }
      return streak;
    }
    case "praises_given_count_month": {
      const r = await safe(() => supabase.from("praises").select("id", { count: "exact", head: true }).eq("autor_id", uid).gte("criado_em", startOfMonthISO()));
      return r?.count ?? null;
    }
    case "praises_given_total": {
      const r = await safe(() => supabase.from("praises").select("id", { count: "exact", head: true }).eq("autor_id", uid));
      return r?.count ?? null;
    }
    case "received_kudos_count": {
      const r = await safe(() => supabase.from("praises").select("id", { count: "exact", head: true }).eq("destinatario_id", uid));
      return r?.count ?? null;
    }
    case "received_peer_external_kudos_count": {
      const r = await safe(() => supabase.from("praises").select("id", { count: "exact", head: true }).eq("destinatario_id", uid).in("praise_type", ["peer", "equipe_externa"]));
      return r?.count ?? null;
    }
    case "training_completions_count": {
      const r = await safe(() => supabase.from("training_completions").select("id", { count: "exact", head: true }).eq("user_id", uid));
      return r?.count ?? null;
    }
    case "weekly_commitments_kept_streak": {
      const r = await safe(() => supabase.from("weekly_commitments").select("week_start_date,status").eq("user_id", uid).order("week_start_date", { ascending: false }).limit(40));
      if (!r?.data) return null;
      const byWeek = new Map<string, { total: number; ok: number }>();
      for (const row of r.data as any[]) {
        const k = row.week_start_date;
        const e = byWeek.get(k) ?? { total: 0, ok: 0 };
        e.total++;
        if (row.status === "cumprido" || row.status === "parcial") e.ok++;
        byWeek.set(k, e);
      }
      const weeks = [...byWeek.entries()].sort((a, b) => b[0].localeCompare(a[0]));
      let streak = 0;
      for (const [, v] of weeks) {
        if (v.total > 0 && v.ok / v.total >= 0.8) streak++;
        else break;
      }
      return streak;
    }
    case "stories_streak_7d": {
      const r = await safe(() => supabase.from("galeria").select("created_at").eq("publicado_por", uid).order("created_at", { ascending: false }).limit(60));
      if (!r?.data) return null;
      const set = new Set<string>((r.data as any[]).map((x) => new Date(x.created_at).toISOString().slice(0, 10)));
      return computeStreak(set);
    }
    case "occurrences_resolved_count": {
      const r = await safe(() => supabase.from("leadership_occurrences").select("id", { count: "exact", head: true }).eq("atribuido_a", uid).eq("status", "resolvido"));
      return r?.count ?? null;
    }
    case "years_at_curio": {
      if (!profile.data_admissao) return 0;
      const start = new Date(profile.data_admissao);
      const now = new Date();
      const years = (now.getTime() - start.getTime()) / (365.25 * 86400000);
      return Math.floor(years);
    }
    case "days_without_advertencia": {
      if (!profile.unit_id) return 0;
      // Get user's unidade (enum) via profile
      const p = await safe(() => supabase.from("profiles").select("unidade").eq("user_id", uid).maybeSingle());
      const unidade = (p?.data as any)?.unidade;
      if (!unidade) return 0;
      const r = await safe(() => supabase.from("advertencias").select("data").eq("unidade", unidade).order("data", { ascending: false }).limit(1));
      if (!r?.data) return null;
      if (r.data.length === 0) return 999;
      const last = new Date((r.data[0] as any).data);
      const days = Math.floor((Date.now() - last.getTime()) / 86400000);
      return days;
    }
    case "curio_do_mes_wins": {
      const r = await safe(async () => {
        const tm = await supabase.from("team_members").select("id").eq("user_id", uid);
        if (!tm.data || tm.data.length === 0) return { count: 0 };
        const ids = tm.data.map((x: any) => x.id);
        const c = await supabase.from("employee_of_month").select("id", { count: "exact", head: true }).in("team_member_id", ids);
        return { count: c.count ?? 0 };
      });
      return r?.count ?? null;
    }
    case "onboarded_collaborators": {
      if (!profile.unit_id) return 0;
      const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
      const r = await safe(() => supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("unit_id", profile.unit_id!).gte("created_at", ninetyDaysAgo));
      return r?.count ?? null;
    }
    case "access_streak_30d": {
      const r = await safe(() => supabase.from("profiles").select("login_count").eq("user_id", uid).maybeSingle());
      // No reliable per-day login table; approximate with login_count capped at 30
      const lc = (r?.data as any)?.login_count ?? 0;
      return Math.min(30, lc);
    }
    case "birthday_messages_sent":
    case "manual_pioneiro":
      return 0; // not auto-calculated
    default:
      return null;
  }
}

async function processUser(profile: Profile, achievements: Achievement[]) {
  const unlocks: { user_id: string; code: string; achievement_id: string }[] = [];
  for (const a of achievements) {
    if (a.role_filter && a.role_filter.length > 0 && !a.role_filter.includes(profile.cargo)) continue;
    const value = await metricValue(a.criteria_metric, profile);
    if (value === null) continue; // graceful skip

    const target = a.criteria_target ?? 1;
    const wasCompleted = value >= target;

    // upsert: only mark completed=true once. If already completed, keep unlocked_at.
    const existing = await supabase.from("user_achievements").select("id,completed,unlocked_at").eq("user_id", profile.user_id).eq("achievement_id", a.id).maybeSingle();

    const payload: Record<string, unknown> = {
      user_id: profile.user_id,
      achievement_id: a.id,
      current_progress: value,
      last_calculated_at: new Date().toISOString(),
    };

    if (existing.data?.completed) {
      payload.completed = true;
      payload.unlocked_at = existing.data.unlocked_at;
    } else if (wasCompleted) {
      payload.completed = true;
      payload.unlocked_at = new Date().toISOString();
      unlocks.push({ user_id: profile.user_id, code: a.code, achievement_id: a.id });
    } else {
      payload.completed = false;
    }

    if (existing.data) {
      await supabase.from("user_achievements").update(payload).eq("id", existing.data.id);
    } else {
      await supabase.from("user_achievements").insert(payload);
    }
  }
  return unlocks;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { data: achievements } = await supabase
      .from("achievements")
      .select("id,code,criteria_type,criteria_target,criteria_metric,role_filter")
      .eq("active", true);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id,cargo,unit_id,data_admissao")
      .eq("ativo", true);

    if (!achievements || !profiles) {
      return new Response(JSON.stringify({ error: "no data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const allUnlocks: { user_id: string; code: string; achievement_id: string }[] = [];
    for (const p of profiles as Profile[]) {
      if (!p.user_id) continue;
      const u = await processUser(p, achievements as Achievement[]);
      allUnlocks.push(...u);
    }

    // Enqueue notifications for new unlocks
    if (allUnlocks.length > 0) {
      const aMap = new Map((achievements as any[]).map((a) => [a.id, a]));
      const events = allUnlocks.map((u) => {
        const a: any = aMap.get(u.achievement_id);
        return {
          type: "achievement_unlocked",
          recipient_user_id: u.user_id,
          title: "Nova conquista desbloqueada!",
          body: `🏆 Você desbloqueou: ${a?.name ?? u.code}`,
          payload: { achievement_id: u.achievement_id, code: u.code },
        };
      });
      await safe(() => supabase.from("notification_events").insert(events));
    }

    return new Response(
      JSON.stringify({ users_processed: profiles.length, unlocks: allUnlocks.length, details: allUnlocks }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
