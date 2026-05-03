# Plano: POLLS RÁPIDAS

Sistema de enquetes rápidas com votação anônima agregada, expiração automática e push notifications.

## 1. Schema SQL (migração única)

### Tabela `polls`
- `id` uuid pk, `author_user_id` fk profiles, `unit_id` fk units (nullable = global)
- `question` text (5-200 chars), `options` jsonb (array `{id, label}`, 2-4 itens validado por trigger)
- `expires_at` timestamptz, `target_roles` text[] default '{}' (vazio = todos)
- `allow_anonymous` bool default true
- `status` text check ('ativa','encerrada','cancelada') default 'ativa'
- Index `(status, expires_at)`

### Tabela `poll_votes`
- `id` uuid pk, `poll_id` fk polls cascade, `user_id` fk profiles cascade
- `option_id` text, `voted_at` timestamptz
- Unique `(poll_id, user_id)`

### Função helper `is_eligible_for_poll(_uid, _poll_id)`
SECURITY DEFINER: retorna true se `target_roles` vazio OR cargo do user ∈ target_roles. Usada em RLS.

### Trigger validação opções
Garante 2-4 opções com `id` e `label` no insert/update.

### Cron job (pg_cron)
- A cada 5min: chama edge `polls-tick` (encerra expiradas + dispara push 30min/encerramento).

## 2. RLS

**polls**
- SELECT: autenticados elegíveis (`is_eligible_for_poll` OR autor)
- INSERT: `is_leadership(auth.uid())` AND author=self
- UPDATE/DELETE: author=self

**poll_votes**
- INSERT: `user_id=auth.uid()` AND poll status='ativa' AND `expires_at>now()` AND `is_eligible_for_poll`
- SELECT: autor da poll OR votante=self
- UPDATE/DELETE: revogado (sem policy)

## 3. Edge Functions

- `polls-tick`: encerra polls com `expires_at<now()`, status='ativa' → status='encerrada' + notification_event para autor; também notifica autor quando faltam ≤30min.
- Notificação na criação: trigger SQL que insere em `notification_events` para users elegíveis da unidade (ou todos se unit_id null).

## 4. Frontend

### Hooks
- `usePolls(filter)` — lista
- `usePoll(id)` — detalhe + opções
- `usePollResults(id)` — agregado por opção e por unidade (pra autor)
- `useVotePoll()` — mutation
- `useCreatePoll()` — mutation
- `useMyEligiblePolls()` — feed

### Componentes
- `NovaPollModal.tsx` — question, 2-4 opções dinâmicas, chips de prazo (1h/4h/12h/24h), multi-select de cargos
- `PollCard.tsx` — estado ativo (botões de voto + countdown) / encerrado (barras + total)
- `PollResultsBars.tsx` — barras coloridas com %
- `PollUnitBreakdown.tsx` — só pra autor, agrupado por unidade

### Páginas/Rotas
- `/polls` — `PollsListPage` (tabs: Ativas / Encerradas / Minhas)
- `/polls/:id` — `PollDetailPage`
- Integração no `FeedColaborador`: card de polls ativas elegíveis no topo
- Botão "+ Nova poll" no header do Feed para líderes

### Sidebar
- Item "Polls" visível a todos os perfis

## 5. Arquivos tocados

**Criados:**
- `supabase/migrations/<ts>_polls.sql`
- `supabase/functions/polls-tick/index.ts`
- `src/hooks/usePolls.ts`
- `src/hooks/usePoll.ts`
- `src/hooks/useVotePoll.ts`
- `src/components/polls/NovaPollModal.tsx`
- `src/components/polls/PollCard.tsx`
- `src/components/polls/PollResultsBars.tsx`
- `src/components/polls/PollUnitBreakdown.tsx`
- `src/components/polls/PollsFeedWidget.tsx`
- `src/pages/PollsListPage.tsx`
- `src/pages/PollDetailPage.tsx`

**Editados:**
- `src/App.tsx` (rotas)
- `src/components/AppSidebar.tsx` (nav)
- `src/pages/FeedColaborador.tsx` (widget + botão Nova Poll)
- `src/integrations/supabase/types.ts` (auto)
- `supabase/config.toml` (registro do cron, se necessário)
- `.lovable/plan.md`

## Regras
- Único commit reversível
- 1 voto por user via UNIQUE + RLS
- Não toca RLS de outras tabelas

Aprova pra executar?
