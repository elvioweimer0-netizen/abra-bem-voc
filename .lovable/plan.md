# Carta do Curiozinho — Plano

Briefing diário gerado por IA pra liderança (gerente_loja, gerente_adm, supervisor, master, admin), entregue de manhã no topo do Painel. Conteúdo: saudação, 3 ações, 1 destaque, 1 alerta. Tom direto, baseado em snapshot real da unidade.

## 1) Schema (1 migration)

**`curiozinho_briefings`**
- `id uuid pk default gen_random_uuid()`
- `user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE`
- `briefing_date date NOT NULL`
- `content_markdown text NOT NULL`
- `alerts jsonb default '[]'::jsonb`         — `[{ severity, label, link? }]`
- `suggestions jsonb default '[]'::jsonb`    — `[{ title, action_label, link }]`
- `data_snapshot jsonb`                       — fonte do briefing pra auditoria
- `opened_at timestamptz`
- `helpful boolean`
- `created_at`, `updated_at`
- UNIQUE (user_id, briefing_date)
- Index (user_id, briefing_date desc)

**RLS**
- `SELECT`: `user_id = auth.uid()` (cada um só vê o próprio).
- `UPDATE`: `user_id = auth.uid()` mas restrito às colunas `opened_at` e `helpful` via trigger `tg_briefing_user_update` que rejeita alteração de outras colunas.
- `INSERT`/demais `UPDATE`: bloqueado pra anon/authenticated. Edge function usa service role.

## 2) Edge function `generate-daily-briefing` (verify_jwt = false, cron-friendly)

Fluxo:
1. Lista users alvo: `cargo IN (gerente_loja, gerente_adm, supervisor, master, admin)`, `ativo = true`, `user_id NOT NULL`.
2. Pra cada user, monta snapshot dos últimos 7 dias com queries graceful (try/catch por bloco; se tabela faltar/erro → ignora):
   - `daily_mood` da unidade: média + lista de colaboradores com 3 dias consecutivos < 3.
   - `checklist_completions` vs `checklist_templates`: % completude.
   - `advertencias`, `leadership_occurrences`, `suspensoes` da unidade: contagens.
   - `avisos` ativos vs `aviso_reads` faltando do próprio user.
   - `daily_huddle` preenchidos últimos 7 dias.
   - Compromissos cumpridos vs pendentes (`commitments`).
   - Aniversariantes próximos 7 dias na unidade.
   - Se `is_rh_or_admin`: histórias `pendente` em `curio_stories`.
   - "Curió de Ouro" recentes (`praises` ou achievements).
3. Chama Lovable AI Gateway (`google/gemini-3-flash-preview`) com tool calling estruturado retornando:
   ```json
   { "saudacao": "...", "acoes": [3 strings], "destaque": "...", "alerta": "..." | null }
   ```
4. Renderiza markdown final + monta `alerts` (do alerta + thresholds duros do snapshot, ex.: humor crítico) e `suggestions` (cada ação vira sugestão com link inferido por keyword: checklist→/checklist-diario, advertência→/advertencias, huddle→/daily-huddle, etc.).
5. Upsert em `curiozinho_briefings` com `briefing_date = current_date` (ON CONFLICT DO NOTHING — não regera no mesmo dia).
6. Falha graciosa: se LLM erro/timeout → grava briefing fallback estático ("Bom dia! Hoje sem dados novos. Confira seu painel.") sem alertas.

Cron via `pg_cron` + `pg_net`: 06:00 BRT (09:00 UTC). Inserido como SQL separado (não migration) usando `supabase--insert`.

## 3) Frontend

### Card no Painel (`Dashboard.tsx`)
- Componente novo `src/components/curiozinho/CartaCuriozinhoCard.tsx`.
- Visível pra `gerente_loja | gerente_adm | supervisor | admin | master` (via `useRole`).
- Hook `useDailyBriefing()` (TanStack Query, key `["briefing", userId, today]`, `staleTime: 5min`).
- Estados: skeleton; vazio ("Seu briefing chega às 6h"); briefing pronto.
- Header: avatar do Curiozinho + saudação + data + chevron expand.
- Ao expandir: marca `opened_at` (mutation), renderiza `<ReactMarkdown>` do `content_markdown`.
- Alerts como badges coloridos por severity (`info` muted / `warn` warning / `crit` destructive).
- Suggestions como lista; cada item com botão "Fazer agora" → `navigate(link)`.
- Footer: "👍 útil / 👎 não útil" (mutation seta `helpful`); disclaimer pequeno "Sugestões geradas por IA. Use seu julgamento.".
- Inserido no topo do `Dashboard.tsx` antes do `HeaderHome`/após (logo após `<HeaderHome />`).

### Página `/curiozinho/historico`
- `src/pages/CuriozinhoHistorico.tsx`.
- Lista de briefings do próprio user agrupados por mês (Accordion por dia).
- Filtro: select de mês (últimos 12).
- Reaproveita render de markdown + alerts.
- Rota adicionada em `App.tsx` dentro do `AppLayout`, sem gate especial (qualquer user logado vê o próprio histórico — vazio se não recebe).

### Hooks
- `src/hooks/useDailyBriefing.ts` — fetch do briefing de hoje + mutations `markOpened`, `markHelpful`.
- `src/hooks/useBriefingHistory.ts` — lista paginada por mês.

### Sidebar
- `AppSidebar.tsx`: item "Carta do Curiozinho" (link `/curiozinho/historico`) só pra cargos elegíveis, dentro do grupo do Curiozinho/perfil.

## 4) Ética / segurança
- Disclaimer fixo no card e na página de histórico.
- Snapshot só agregado da unidade — sem expor user_id de terceiros, exceto contagens anônimas (ex: "3 colaboradores com humor baixo"). Nomes só pra aniversariantes (já públicos no app).
- Briefing imutável após gerado (só `opened_at`/`helpful` editáveis pelo dono, garantido por trigger).
- Cron + service role só na edge function; client nunca insere.

## 5) Arquivos previstos

**Criados**
- `supabase/migrations/<ts>_curiozinho_briefings.sql` (tabela, RLS, trigger de proteção, índice)
- `supabase/functions/generate-daily-briefing/index.ts`
- `src/components/curiozinho/CartaCuriozinhoCard.tsx`
- `src/components/curiozinho/CartaCuriozinhoSkeleton.tsx`
- `src/hooks/useDailyBriefing.ts`
- `src/hooks/useBriefingHistory.ts`
- `src/pages/CuriozinhoHistorico.tsx`

**Editados**
- `src/App.tsx` (rota `/curiozinho/historico`)
- `src/components/AppSidebar.tsx` (item)
- `src/pages/Dashboard.tsx` (montar card no topo, gated por role)
- `.lovable/plan.md`
- (auto) `src/integrations/supabase/types.ts`

**Pós-migration (separado, via insert)**: cron `pg_cron` invocando a edge function 06:00 BRT diário.

Aprova pra eu executar?
