# Plano — Compromissos Públicos da Semana

Cada líder declara até **3 compromissos** na segunda e avalia o resultado na sexta. Visível só pra liderança (transparência horizontal); colaboradores não veem.

## 1. Banco de dados (migration única)

**Tabela `weekly_commitments`**
- `id uuid pk default gen_random_uuid()`
- `user_id uuid not null references profiles(user_id) on delete cascade`
- `unit_id uuid references units(id) on delete set null` (snapshot da unidade do autor)
- `week_start_date date not null` (sempre segunda-feira da semana)
- `commitment_text text not null check (char_length(commitment_text) between 10 and 200)`
- `ordem smallint not null check (ordem between 1 and 3)`
- `status text not null default 'em_andamento' check (status in ('em_andamento','cumprido','parcial','nao_cumprido','cancelado'))`
- `evidencia text default ''`
- `evaluated_at timestamptz`
- `created_at`, `updated_at` (trigger `update_updated_at_column`)
- `UNIQUE (user_id, week_start_date, ordem)` — limita 3/semana
- `INDEX (week_start_date desc, unit_id)`, `INDEX (user_id, week_start_date desc)`

**Função helper `is_commitment_viewer(_user_id)`** (SECURITY DEFINER)
Retorna `true` para: admin, master, supervisor, gerente_loja, gerente, gerente_adm, encarregado, fiscal, lider_setor (todos exceto colaborador).

**RLS**
- `SELECT`: `is_commitment_viewer(auth.uid())`.
- `INSERT`: `user_id = auth.uid()` AND `is_commitment_viewer(auth.uid())` (mesma lista). Evidência precisa estar vazia, status `em_andamento`.
- `UPDATE`: `user_id = auth.uid()` AND (
    - **edição do texto** permitida até quarta-feira (`current_date <= week_start_date + 2`), OU
    - **avaliação** permitida até domingo (`current_date <= week_start_date + 6`)
  ). Admin/master sempre podem.
- `DELETE`: nenhuma policy.

## 2. Frontend

**Hook** `src/hooks/useWeeklyCommitments.ts`
- Helper local `getMonday(date)` → segunda da semana ISO.
- `useMyCommitments(weekStart)` — meus compromissos da semana.
- `useCommitmentHistory(userId, limit=8)` — semanas passadas do autor.
- `useCommitmentsBoard(weekStart)` — todos os líderes acessíveis com seus compromissos da semana.
- `useDeclareCommitments()` — cria 3 registros (transação client-side com upsert por `(user_id, week_start, ordem)`).
- `useEvaluateCommitment()` — atualiza status + evidencia + evaluated_at.

**Componentes** em `src/components/commitments/`
- `CommitmentStatusBadge.tsx` — chip colorido por status (token semântico).
- `DeclararCompromissosModal.tsx` — Dialog com 3 textareas (10–200 chars, contador). Botão "Publicar".
- `AvaliarCompromissosModal.tsx` — Dialog que lista os 3 compromissos da semana atual com select status + textarea evidencia + "Salvar avaliação".
- `CommitmentCard.tsx` — card de pessoa: avatar, nome, unidade, lista dos 3 compromissos com status.
- `CommitmentsWidget.tsx` — para o Dashboard/Painel: mostra status do usuário (declarar/avaliar/ok) + CTA.

**Páginas**
- `src/pages/Compromissos.tsx` (`/compromissos`, líderes)
  - Header: "Semana de DD/MM a DD/MM".
  - Caixa de ação:
    - se hoje ∈ [seg..qua] e sem declaração → CTA "Declarar compromissos".
    - se hoje ∈ [sex..dom] e há declaração sem avaliação → CTA "Avaliar".
  - Lista atual (3 cards horizontais).
  - Accordion "Semanas anteriores" usando `useCommitmentHistory`.
- `src/pages/CompromissosBoard.tsx` (`/compromissos/board`, master/admin/supervisor)
  - Filtro de semana.
  - Kanban com 4 colunas (Em andamento, Parcial, Cumprido, Não cumprido) + coluna lateral "Sem declaração". Cards `CommitmentCard` agrupados por status (cada compromisso individual vira card pra granularidade).

**Widget no Painel**: incluir `<CommitmentsWidget />` no `Dashboard.tsx` apenas se `isLider`.

## 3. Notificações push (edge function + cron)

**Edge function** `supabase/functions/commitments-reminders/index.ts`
- modes: `declare` (segunda 8:30), `evaluate` (sexta 16:00), `late` (terça 9:00).
- `declare`: avisa todos viewers que ainda não declararam essa semana.
- `late`: viewers sem declaração até terça → reminder.
- `evaluate`: viewers com declaração e sem `evaluated_at` para algum item.
- Insere em `notification_events` (mesmo padrão do daily-huddle).

**Crons via `supabase--insert`** (timezone BRT → UTC = +3):
- `commitments-declare`: `30 11 * * 1` (08:30 BRT seg)
- `commitments-late`:    `0 12 * * 2` (09:00 BRT ter)
- `commitments-evaluate`:`0 19 * * 5` (16:00 BRT sex)

`supabase/config.toml`: bloco `[functions.commitments-reminders]` com `verify_jwt = false`.

## 4. Navegação

`src/components/AppSidebar.tsx`: nova seção "Compromissos" com:
- "Compromissos" (`/compromissos`) — `isLider`.
- "Quadro" (`/compromissos/board`) — `isAdmin || isSupervisor`.

`src/App.tsx`: 2 rotas dentro de `AppLayout` com guards `LeaderOnly` e `SupervisorOnly`.

## Arquivos tocados

**Novos**
- `supabase/migrations/<ts>_weekly_commitments.sql`
- `supabase/functions/commitments-reminders/index.ts`
- `src/hooks/useWeeklyCommitments.ts`
- `src/components/commitments/CommitmentStatusBadge.tsx`
- `src/components/commitments/DeclararCompromissosModal.tsx`
- `src/components/commitments/AvaliarCompromissosModal.tsx`
- `src/components/commitments/CommitmentCard.tsx`
- `src/components/commitments/CommitmentsWidget.tsx`
- `src/pages/Compromissos.tsx`
- `src/pages/CompromissosBoard.tsx`

**Editados**
- `src/App.tsx` (2 rotas + imports)
- `src/components/AppSidebar.tsx` (seção)
- `src/pages/Dashboard.tsx` (widget no topo, atrás de `isLider`)
- `supabase/config.toml` (bloco da função)
- `src/integrations/supabase/types.ts` (auto pós-migration)

## Regras respeitadas
- Não toca em RLS de outras tabelas.
- Função helper isolada (`is_commitment_viewer`) — não altera funções existentes.
- Cron via `supabase--insert` (segredos), não em migration.
- Tudo reversível via revert do commit.

Aprova pra eu executar?