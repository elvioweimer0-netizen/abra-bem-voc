import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI key not configured" }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "missing auth" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const raw_input = String(body?.raw_input ?? "").trim();
    if (!raw_input) return json({ error: "raw_input vazio" }, 400);
    if (raw_input.length > 60000) return json({ error: "Texto muito grande (máx 60k caracteres)" }, 400);

    const { data: profile } = await supabase
      .from("profiles")
      .select("unit_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const systemPrompt = `Você é um analista que lê exports de grupos de WhatsApp de uma rede de supermercados em pt-BR.
Formato típico de cada linha: "[dd/mm/yyyy HH:MM] Nome: mensagem" (variações são comuns).
Categorize CADA mensagem relevante em uma única categoria:
- acoes: pedidos, dúvidas ou problemas que precisam de RESPOSTA/DECISÃO do gerente
- decisoes: decisões já tomadas, alinhamentos confirmados, regras combinadas
- reclamacoes: clientes reclamando, problemas operacionais (falta produto, equipamento quebrado, sujeira)
- menos_relevantes: brincadeiras, bom dia, conversas casuais, mídia sem contexto
Ignore mensagens vazias e "<Mídia oculta>". Para cada item devolva timestamp (string original ou ""), autor (nome ou "Desconhecido") e texto resumido em até 200 caracteres.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: raw_input },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "categorize_messages",
              description: "Devolve as mensagens categorizadas",
              parameters: {
                type: "object",
                properties: {
                  acoes: { type: "array", items: itemSchema() },
                  decisoes: { type: "array", items: itemSchema() },
                  reclamacoes: { type: "array", items: itemSchema() },
                  menos_relevantes: { type: "array", items: itemSchema() },
                },
                required: ["acoes", "decisoes", "reclamacoes", "menos_relevantes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "categorize_messages" } },
      }),
    });

    if (aiRes.status === 429) return json({ error: "Muitas requisições. Aguarde um pouco." }, 429);
    if (aiRes.status === 402) return json({ error: "Créditos de IA esgotados. Avise o admin." }, 402);
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return json({ error: "Falha na IA. Tente novamente." }, 502);
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: any = { acoes: [], decisoes: [], reclamacoes: [], menos_relevantes: [] };
    try {
      parsed = JSON.parse(toolCall?.function?.arguments ?? "{}");
    } catch (e) {
      console.error("parse tool_call failed", e);
    }
    const summary = {
      acoes: Array.isArray(parsed.acoes) ? parsed.acoes : [],
      decisoes: Array.isArray(parsed.decisoes) ? parsed.decisoes : [],
      reclamacoes: Array.isArray(parsed.reclamacoes) ? parsed.reclamacoes : [],
      menos_relevantes: Array.isArray(parsed.menos_relevantes) ? parsed.menos_relevantes : [],
    };

    const { data: inserted, error: insErr } = await supabase
      .from("whatsapp_summaries")
      .insert({
        user_id: user.id,
        unit_id: profile?.unit_id ?? null,
        raw_input,
        summary,
      })
      .select("id, summary, created_at")
      .single();

    if (insErr) {
      console.error("insert error", insErr);
      return json({ error: "Falha ao salvar resumo" }, 500);
    }

    return json({ id: inserted.id, summary: inserted.summary, created_at: inserted.created_at });
  } catch (e) {
    console.error("fatal", e);
    return json({ error: e instanceof Error ? e.message : "erro" }, 500);
  }
});

function itemSchema() {
  return {
    type: "object",
    properties: {
      timestamp: { type: "string" },
      autor: { type: "string" },
      texto: { type: "string" },
    },
    required: ["timestamp", "autor", "texto"],
    additionalProperties: false,
  };
}
