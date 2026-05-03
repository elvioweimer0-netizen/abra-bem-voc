# Plano — Daily Huddle Digital

Feature isolada de `leadership_meetings`. Registro diário rápido (≤2min) feito pelo gerente da unidade às 9:30, com painel agregado pra direção/supervisão.

## 1. Banco de dados (migration única)

**Tabela `daily_huddle_reports`**
- `id uuid pk default gen_random_uuid()`
- `report_date date not null`
- `unit_id uuid not null references units(id) on delete cascade`
- `author_user_id uuid references profiles(user_id) on delete set null`
- `bo_dia text default ''` — boletim do dia (ocorrências, faltas, eventos)
- `informativos text default ''` — recados, campanhas, treinamentos
- `venda_dia_anterior numeric(12,2)` — nullable
- `meta_dia numeric(12,2)` — nullable
- `meta_status text check (in 'no_caminho','em_risco','atingida','nao_atingida') default 'no_caminho'`
- `observacao text default ''`
- `submitted_at timestamptz default now()`
- `updated_at timestamptz default now()` (trigger `update_updated_at_column`)
- `UNIQUE (report_date, unit_id)`
- `INDEX (report_date DESC, unit_id)`

**RLS**
- `SELECT`: master/admin/supervisor (tudo) **OU** `user_can_access_unit(auth.uid(), unit_id)` (gerente_loja/encarregado/líder da unidade veem só a sua).
- `INSERT`: `is_leadership(auth.uid())` AND `user_can_access_unit(auth.uid(), unit_id)` AND `author_user_id = auth.uid()`.
- `UPDATE`: `author_user_id = auth.uid()` AND `report_date = current_date` (mesmo dia, só autor). Master/admin podem editar a qualquer momento.
- `DELETE`: nenhuma policy (bloqueado).

## 2. Frontend

**Hook** `src/hooks/useDailyHuddle.ts`
- `useTodayReport(unitId)` — busca registro de hoje
- `useHuddleHistory(unitId, days=7)` — últimos 7
- `useHuddlePanel(date)` — todos os relatórios de uma data + lista de unidades visíveis (junta com `useAccessibleUnits`)
- `useUpsertHuddle()` — mutation insert/update

**Componente** `src/components/daily-huddle/DailyHuddleForm.tsx`
- 4 campos principais: `bo_dia` (textarea), `informativos` (textarea), bloco numérico (`venda_dia_anterior`, `meta_dia`, `meta_status` select com 4 opções), `observacao` (textarea).
- Botão "Salvar Daily" — usa `useUpsertHuddle`. Se já existe hoje, vira "Atualizar".

**Página** `src/pages/DailyHuddle.tsx` (`/daily-huddle`) — perfis líderes
- Header: data atual + dia da semana em PT-BR
- Se hoje é dia útil (seg-sex) e não há registro → form em destaque
- Histórico: lista colapsável dos últimos 7 dias da unidade do usuário (gerente_loja/encarregado/líder veem própria unidade; admin/master/supervisor veem dropdown de unidade)
- Card de cada dia mostra: status meta com chip colorido + preview do `bo_dia`

**Página** `src/pages/DailyHuddlePainel.tsx` (`/daily-huddle/painel`) — master/admin/supervisor
- Filtro de data (default: hoje)
- Grid responsivo de cards (1 por unidade visível)
- Cada card: nome unidade, badge **preenchido** (verde) ou **pendente** (âmbar piscante se hoje), venda dia anterior, status meta com cor (`no_caminho`=azul, `em_risco`=âmbar, `atingida`=verde, `nao_atingida`=vermelho)
- Click → Sheet/Dialog com conteúdo completo

**Cores via tokens semânticos** (`bg-primary`, `bg-warning`, `bg-success`, `bg-destructive`) — sem cor hardcoded.

## 3. Notificações push

Reaproveita `notification_events` existente (mesma estrutura que `enqueue_high_occurrence_notification`).

**Edge Function** `supabase/functions/daily-huddle-reminders/index.ts`
- Endpoint único, decide ação por horário atual em `America/Fortaleza`.
- **9:25 seg-sex (exceto terça)**: enfileira notificação pra todos com `is_leadership` em unidades de loja: "Daily 9:30 chegando — registre o BO do dia".
- **10:00 seg-sex**: pega unidades sem `daily_huddle_reports` de hoje → notifica usuários cujo `nome ILIKE '%roberto%' OR '%guga%'` OR `has_role('admin'/'master')` com lista de unidades pendentes.

**Cron** via `supabase--insert` (pg_cron + pg_net), 2 jobs:
- `daily-huddle-9-25`: `25 12 * * 1,3,4,5` (UTC; 9:25 BRT = 12:25 UTC; seg, qua, qui, sex — pula terça)
- `daily-huddle-10-00`: `0 13 * * 1-5` (10:00 BRT = 13:00 UTC, seg-sex)

`config.toml`: `verify_jwt = false` pra função (chamada por cron).

## 4. Navegação

- `src/App.tsx`: rotas `/daily-huddle` e `/daily-huddle/painel` dentro do `AppLayout`.
- `src/components/AppSidebar.tsx`: novo item **"Daily Huddle"** visível pra `is_leadership` (gerente, gerente_loja, encarregado, lider_setor, supervisor, admin, master). "Painel Daily" só pra admin/master/supervisor.

## Arquivos tocados

**Novos**
- `supabase/migrations/<ts>_daily_huddle.sql`
- `supabase/functions/daily-huddle-reminders/index.ts`
- `src/hooks/useDailyHuddle.ts`
- `src/components/daily-huddle/DailyHuddleForm.tsx`
- `src/components/daily-huddle/HuddleStatusBadge.tsx`
- `src/components/daily-huddle/HuddlePanelCard.tsx`
- `src/pages/DailyHuddle.tsx`
- `src/pages/DailyHuddlePainel.tsx`

**Editados**
- `src/App.tsx` (2 rotas)
- `src/components/AppSidebar.tsx` (item nav)
- `supabase/config.toml` (bloco da função)
- `src/integrations/supabase/types.ts` (auto, pós-migration)

## Regras respeitadas
- Não toca em `leadership_meetings` nem RLS de outras tabelas.
- Tudo reversível: migration única + arquivos novos + 3 edits pontuais.
- Cron via `supabase--insert` (segredos do projeto, não em migration).
- Anonimato N/A; somente gestão e líderes acessam.

Aprova pra eu executar?