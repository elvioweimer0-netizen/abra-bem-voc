import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

interface ChecklistItem {
  id: string;
  descricao: string;
  tipo_resposta?: string;
  requires_photo?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { transcript, items } = await req.json();
    if (!transcript || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "transcript e items são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const itemsList = (items as ChecklistItem[])
      .map((it, i) => `${i + 1}. [${it.id}] ${it.descricao}${it.requires_photo ? " (requer foto)" : ""}`)
      .join("\n");

    const systemPrompt = `Você analisa transcrições de voz em pt-BR de gerentes de loja relatando tarefas concluídas em um checklist operacional.
Dado o texto falado e a lista de itens, identifique quais itens foram afirmados como concluídos.
Considere sinônimos, frases parciais e contexto coloquial brasileiro.
- confidence "high": gerente mencionou claramente o item
- confidence "medium": menção ambígua ou indireta
- confidence "low": só pista distante (geralmente NÃO incluir)
NÃO inclua itens que não foram mencionados.`;

    const userPrompt = `TRANSCRIÇÃO:
"""${transcript}"""

ITENS DO CHECKLIST:
${itemsList}

Retorne os itens identificados via tool call.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_matches",
              description: "Retorna itens identificados na fala",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        item_id: { type: "string" },
                        confidence: { type: "string", enum: ["high", "medium", "low"] },
                        evidence: { type: "string" },
                      },
                      required: ["item_id", "confidence", "evidence"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["matches"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_matches" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de requisições, tente novamente em instantes." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos esgotados na workspace Lovable AI." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const txt = await response.text();
      console.error("AI gateway error:", response.status, txt);
      return new Response(JSON.stringify({ error: "Erro ao processar com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let matches: any[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        matches = Array.isArray(parsed.matches) ? parsed.matches : [];
      } catch (e) {
        console.error("Falha ao parsear tool args:", e);
      }
    }

    // filter to known item IDs
    const validIds = new Set((items as ChecklistItem[]).map((i) => i.id));
    matches = matches.filter((m) => validIds.has(m.item_id));

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-voice-checklist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
