# Plano — Resumo Automático do WhatsApp

Líder cola o export do WhatsApp do dia, IA categoriza em Ações / Decisões / Reclamações / Menos relevantes, com histórico privado por usuário.

## 1) Banco de dados (migration única)

Tabela `whatsapp_summaries`:
- `id uuid pk default gen_random_uuid()`
- `user_id uuid not null references profiles(user_id) on delete cascade`
- `unit_id uuid references units(id)`
- `raw_input text not null`
- `summary jsonb` — `{ acoes[], decisoes[], reclamacoes[], menos_relevantes[] }`, cada item: `{ timestamp, autor, texto }`
- `created_at timestamptz default now()`
- Index `(user_id, created_at desc)`

RLS:
- `ENABLE ROW LEVEL SECURITY`
- INSERT: `user_id = auth.uid()`
- SELECT: `user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'master')`
- DELETE: `user_id = auth.uid()`
- UPDATE: bloqueado (sem policy)

## 2) Edge function `process-whatsapp-summary`

`supabase/functions/process-whatsapp-summary/index.ts`, `verify_jwt = false` (validação manual de JWT pra pegar `user_id`).

- Body: `{ raw_input: string }` (limita a ~50k chars; rejeita vazio)
- Lê JWT do header `Authorization`, valida com supabase admin client, pega `user_id` e `unit_id` via tabela `profiles`
- Chama Lovable AI Gateway (`google/gemini-3-flash-preview`) com **tool calling estruturado** (`categorize_messages`) que devolve `{ acoes, decisoes, reclamacoes, menos_relevantes }`, cada item `{ timestamp, autor, texto }`
- Prompt do sistema explica heurísticas pt-BR (export padrão `[dd/mm/yyyy HH:MM] Nome: msg`)
- Trata 429/402 retornando JSON `{ error }` apropriado
- Insere em `whatsapp_summaries` (com `service_role` pra bypassar RLS no insert é desnecessário — usa client com JWT do user, RLS aplica)
- Retorna `{ id, summary }`
- CORS padrão
- Registro em `supabase/config.toml`

## 3) Frontend

### Hook `src/hooks/useWhatsappSummary.ts`
- `useWhatsappSummaries()` → query lista (próprios)
- `useWhatsappSummary(id)` → query item
- `useProcessWhatsappSummary()` → mutation invoca edge function
- `useDeleteWhatsappSummary()` → mutation delete

### Página `src/pages/WhatsappResumo.tsx` (rota `/whatsapp-resumo`)
- Header + disclaimer de privacidade
- `Textarea` grande (autosize) + botão "Resumir" (loading state)
- Resultado em 4 cards coloridos via tokens semânticos (`destructive`, `success`/verde, `warning`/amarelo, `muted`):
  - Ações, Decisões, Reclamações, Menos relevantes
  - Cada item: badge timestamp + nome + texto
  - Em "Ações": botões "Criar aviso" (link `/avisos` com query `?draft=`) e "Criar ocorrência" (link `/bo-eletronico?draft=`)
- Botão "Apagar este resumo" sempre visível depois de gerado
- Link "Ver histórico"

### Página `src/pages/WhatsappResumoHistorico.tsx` (rota `/whatsapp-resumo/historico`)
- Lista em `Accordion` (shadcn) com data + 4 contadores no trigger
- Conteúdo: mesmas 4 seções compactas
- Botão "Apagar" por item

### Roteamento `src/App.tsx`
Adicionar rotas dentro do `AppLayout`, protegidas (mesma lógica das outras).

### Sidebar `src/components/AppSidebar.tsx`
Item "Resumo WhatsApp" visível pra `master, admin, supervisor, gerente_loja, gerente_adm, gerente, encarregado` (usar `useRole`).

### Command Palette
Adicionar entrada estática "Resumo WhatsApp" em `CommandPalette.tsx` pros mesmos cargos.

## 4) Privacidade
- Disclaimer fixo no topo da página principal
- Sem compartilhamento entre usuários (RLS garante)
- Delete imediato disponível
- `raw_input` só visível pro próprio user (e master/admin pra suporte)

## 5) Fallbacks
- IA fora (5xx) → toast "Não foi possível resumir agora. Tente em instantes." e mantém o texto colado intacto
- 429 → "Muitas requisições, aguarde 1 min"
- 402 → "Créditos de IA esgotados, avise o admin"
- Tool call malformado → fallback `{ acoes:[], decisoes:[], reclamacoes:[], menos_relevantes:[] }` com aviso

## Arquivos tocados

**Migration:**
- `supabase/migrations/<timestamp>_whatsapp_summaries.sql`

**Criados:**
- `supabase/functions/process-whatsapp-summary/index.ts`
- `src/hooks/useWhatsappSummary.ts`
- `src/pages/WhatsappResumo.tsx`
- `src/pages/WhatsappResumoHistorico.tsx`
- `src/components/whatsapp/WhatsappSummaryCards.tsx` (cards reutilizáveis)

**Editados:**
- `src/App.tsx` (rotas)
- `src/components/AppSidebar.tsx` (item de menu)
- `src/components/command-palette/CommandPalette.tsx` (atalho)
- `supabase/config.toml` (registro da função)
- `.lovable/plan.md`

Aprova?
