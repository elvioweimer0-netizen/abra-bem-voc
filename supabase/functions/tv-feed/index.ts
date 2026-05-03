// Public TV feed: returns consolidated payload for kiosk display
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

type CardType =
  | "aniversariantes"
  | "curio_ouro"
  | "stories_unidade"
  | "top_pendencias"
  | "compromissos_semana"
  | "historias_curio"
  | "avisos_importantes"
  | "conquistas_equipe"
  | "pilula_cultura";

async function fetchCardData(type: CardType, unitId: string, unitCode: string | null) {
  try {
    switch (type) {
      case "aniversariantes": {
        // birthdays today in this unit
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const { data } = await supabase
          .from("profiles")
          .select("nome, cargo_titulo, foto_url, data_nascimento")
          .eq("unit_id", unitId)
          .eq("ativo", true)
          .not("data_nascimento", "is", null);
        const today_md = `${mm}-${dd}`;
        return (data ?? []).filter((p: any) => {
          if (!p.data_nascimento) return false;
          return p.data_nascimento.slice(5, 10) === today_md;
        });
      }
      case "curio_ouro": {
        const since = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data } = await supabase
          .from("praises")
          .select("motivo, categoria, criado_em, autor_id, destinatario_id")
          .eq("unit_id", unitId)
          .eq("publico", true)
          .gte("criado_em", since)
          .order("criado_em", { ascending: false })
          .limit(8);
        if (!data?.length) return [];
        const ids = Array.from(new Set(data.flatMap((p: any) => [p.autor_id, p.destinatario_id])));
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, nome, foto_url, cargo_titulo")
          .in("user_id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
        return data.map((p: any) => ({
          motivo: p.motivo,
          categoria: p.categoria,
          criado_em: p.criado_em,
          autor: map.get(p.autor_id) ?? null,
          destinatario: map.get(p.destinatario_id) ?? null,
        }));
      }
      case "stories_unidade": {
        const since = new Date(Date.now() - 24 * 3600000).toISOString();
        const { data } = await supabase
          .from("stories")
          .select("id, media_url, media_type, caption, created_at, author_user_id")
          .eq("unit_id", unitId)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(8);
        if (!data?.length) return [];
        const ids = data.map((s: any) => s.author_user_id);
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, nome, foto_url")
          .in("user_id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
        return data.map((s: any) => ({ ...s, author: map.get(s.author_user_id) }));
      }
      case "top_pendencias": {
        const { data } = await supabase.rpc("fn_heatmap_indicators", { _period: "semana" });
        const row = (data ?? []).find((r: any) => r.unit_id === unitId);
        if (!row) return [];
        const items = [
          { label: "Advertências", count: row.total_advertencias, icon: "⚠️" },
          { label: "Ocorrências", count: row.total_ocorrencias, icon: "🚨" },
          { label: "Suspensões", count: row.total_suspensoes, icon: "⛔" },
          { label: "Checklists atrasados", count: row.total_checklist_atrasados, icon: "📋" },
          { label: "Faltas", count: row.total_faltas_setor, icon: "🪑" },
          { label: "Vagas abertas", count: row.total_vagas_abertas, icon: "💼" },
          { label: "Avisos pendentes", count: row.avisos_pendentes, icon: "📢" },
        ].filter((i) => i.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
        return items;
      }
      case "compromissos_semana": {
        // Monday of this week
        const now = new Date();
        const day = now.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diff);
        const mondayStr = monday.toISOString().slice(0, 10);
        const { data } = await supabase
          .from("weekly_commitments")
          .select("commitment_text, status, user_id")
          .eq("unit_id", unitId)
          .eq("week_start_date", mondayStr)
          .eq("status", "cumprido")
          .limit(10);
        if (!data?.length) return [];
        const ids = Array.from(new Set(data.map((c: any) => c.user_id)));
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, nome, foto_url")
          .in("user_id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
        return data.map((c: any) => ({ ...c, user: map.get(c.user_id) }));
      }
      case "historias_curio": {
        const { data } = await supabase
          .from("curio_stories")
          .select("id, title, content, image_url, published_at, author_user_id")
          .eq("status", "aprovada")
          .not("published_at", "is", null)
          .order("published_at", { ascending: false })
          .limit(5);
        if (!data?.length) return [];
        const ids = data.map((s: any) => s.author_user_id);
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, nome, foto_url")
          .in("user_id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
        return data.map((s: any) => ({ ...s, author: map.get(s.author_user_id) }));
      }
      case "avisos_importantes": {
        const q = supabase
          .from("avisos")
          .select("id, titulo, conteudo, urgente, created_at")
          .eq("ativo", true)
          .order("urgente", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5);
        const { data } = unitCode
          ? await q.or(`unidade.is.null,unidade.eq.${unitCode}`)
          : await q.is("unidade", null);
        return data ?? [];
      }
      case "conquistas_equipe": {
        const since = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: ua } = await supabase
          .from("user_achievements")
          .select("user_id, achievement_id, unlocked_at")
          .eq("completed", true)
          .gte("unlocked_at", since)
          .order("unlocked_at", { ascending: false })
          .limit(20);
        if (!ua?.length) return [];
        const userIds = Array.from(new Set(ua.map((u: any) => u.user_id)));
        const achIds = Array.from(new Set(ua.map((u: any) => u.achievement_id)));
        const [{ data: profs }, { data: achs }] = await Promise.all([
          supabase.from("profiles").select("user_id, nome, foto_url, unit_id").in("user_id", userIds),
          supabase.from("achievements").select("id, name, icon, description").in("id", achIds),
        ]);
        const pMap = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
        const aMap = new Map((achs ?? []).map((a: any) => [a.id, a]));
        return ua
          .filter((u: any) => pMap.get(u.user_id)?.unit_id === unitId)
          .map((u: any) => ({
            unlocked_at: u.unlocked_at,
            user: pMap.get(u.user_id),
            achievement: aMap.get(u.achievement_id),
          }))
          .slice(0, 8);
      }
      case "pilula_cultura": {
        const today = new Date().toISOString().slice(0, 10);
        const { data } = await supabase
          .from("culture_pills")
          .select("title, content, image_url, display_date")
          .eq("active", true)
          .lte("display_date", today)
          .order("display_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        return data ?? null;
      }
    }
  } catch (err) {
    console.error("[tv-feed] card", type, err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response(JSON.stringify({ error: "missing_token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: display, error } = await supabase
      .from("tv_displays")
      .select("id, name, unit_id, slide_duration_seconds, active")
      .eq("display_token", token)
      .maybeSingle();

    if (error || !display || !display.active) {
      return new Response(JSON.stringify({ error: "invalid_token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: unit } = await supabase
      .from("units")
      .select("id, name, code")
      .eq("id", display.unit_id)
      .maybeSingle();

    const { data: cardsConf } = await supabase
      .from("tv_display_cards")
      .select("card_type, ordem, enabled, config")
      .eq("display_id", display.id)
      .eq("enabled", true)
      .order("ordem", { ascending: true });

    const cards = await Promise.all(
      (cardsConf ?? []).map(async (c: any) => {
        const data = await fetchCardData(c.card_type as CardType, display.unit_id, unit?.code ?? null);
        return { type: c.card_type, config: c.config, data };
      }),
    );

    const payload = {
      display: {
        id: display.id,
        name: display.name,
        unit_id: display.unit_id,
        unit_name: unit?.name ?? null,
        slide_duration_seconds: display.slide_duration_seconds,
      },
      cards: cards.filter((c) => {
        if (c.data == null) return false;
        if (Array.isArray(c.data) && c.data.length === 0) return false;
        return true;
      }),
      generated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(payload), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err) {
    console.error("[tv-feed] error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
