# Conquistas / Badges (Gamificação) — Plano

Sistema de gamificação que premia colaboradores por hábitos, métricas e marcos. Cálculo 100% server-side, com cron diário, push de desbloqueio e UI pra ver/admin/rank.

## 1. Schema (migration única)

### Tabela `achievements`
- `id uuid pk`, `code text unique`, `name`, `description text`, `icon text` (lucide name)
- `category text check (in disciplina|lideranca|cultura|operacao|treinamento|tempo_curio|outros)`
- `criteria_type text check (in count|streak|threshold|one_time|date_based)`
- `criteria_target int nullable`
- `criteria_metric text not null` (string identificadora)
- `role_filter text[] nullable` — cargos elegíveis; null = todos
- `active bool default true`, `ordem smallint default 0`
- `created_at`, `updated_at`

### Tabela `user_achievements`
- `id uuid pk`, `user_id uuid` (= profiles.user_id), `achievement_id uuid fk on delete cascade`
- `current_progress numeric default 0`
- `completed bool default false`, `unlocked_at timestamptz`
- `last_calculated_at timestamptz default now()`
- `unique (user_id, achievement_id)`
- Indexes: `(user_id, completed, unlocked_at desc)`, `(achievement_id, completed)`

### Helper function
- `can_view_user_achievements(_viewer uuid, _target uuid) bool` — true se viewer = target, ou master/admin/supervisor, ou gerente_loja da mesma unidade do target.

### Seed: 15 achievements
| code | category | metric | target | type | role_filter |
|---|---|---|---|---|---|
| disciplinado_30d | disciplina | daily_huddle_streak | 30 | streak | gerente,gerente_loja,encarregado |
| lider_presente_4w | lideranca | aviso_reads_streak_4w | 4 | streak | gerente,gerente_loja,encarregado,supervisor,lider_setor |
| gerador_cultura_10m | cultura | praises_given_count_month | 10 | threshold | null |
| sem_mancha_60d | disciplina | days_without_advertencia | 60 | streak | gerente_loja |
| estrela_do_mes | cultura | curio_do_mes_wins | 1 | one_time | null |
| estudioso_5 | treinamento | training_completions_count | 5 | count | null |
| comprometido_4w | disciplina | weekly_commitments_kept_streak | 4 | streak | gerente_loja |
| fotografo_loja_7d | cultura | stories_streak_7d | 7 | streak | gerente,gerente_loja,encarregado,lider_setor |
| fiscal_exemplar_50 | operacao | occurrences_resolved_count | 50 | count | fiscal |
| veterano_5y | tempo_curio | years_at_curio | 5 | date_based | null |
| aniversariante_feliz_20 | cultura | birthday_messages_sent | 20 | count | null |
| mentor_1 | lideranca | onboarded_collaborators | 1 | count | gerente,gerente_loja,encarregado,lider_setor |
| engajado_30d | disciplina | access_streak_30d | 30 | streak | null |
| pioneiro | outros | manual_pioneiro | 1 | one_time | null |
| kudos_receiver_50 | cultura | received_kudos_count | 50 | count | null |

## 2. RLS

**achievements:**
- SELECT authenticated → `active = true OR has_role admin/master`
- INSERT/UPDATE/DELETE: master/admin

**user_achievements:**
- SELECT: `can_view_user_achievements(auth.uid(), user_id)`
- INSERT/UPDATE/DELETE: bloqueado pra clients (sem policy → falha). Edge function usa service role.

## 3. Edge Function `calculate-achievements`

`supabase/functions/calculate-achievements/index.ts`
- Auth: requer header `x-cron-secret` OU service role JWT (cron envia via pg_net).
- Loop: `profiles ativo=true` × `achievements active=true` filtrado por `role_filter`.
- Resolve métrica via switch graceful: cada métrica retorna `{progress, target?}` ou `null` se a tabela origem não existir (try/catch). Fontes:
  - `daily_huddle_count|streak`: `daily_huddle_reports` por author_user_id
  - `aviso_reads_streak_4w`: `aviso_reads` agrupado por semana
  - `praises_given_count_month`: `praises` por autor_id no mês corrente
  - `training_completions_count`: `training_completions`
  - `weekly_commitments_kept_streak`: `weekly_commitments` status='cumprido' por week_start
  - `stories_streak_7d`: `galeria` (publicado_por, daily)
  - `occurrences_resolved_count`: `leadership_occurrences` status='resolvido' atribuido_a
  - `years_at_curio`: `profiles.data_admissao` → ano completo
  - `received_kudos_count`: `praises` destinatario
  - `access_streak_30d`: `profiles.login_count` ou `last_login_at` (se existir; senão 0)
  - `days_without_advertencia`: `advertencias` da unidade do gerente
  - `curio_do_mes_wins`: `employee_of_month` ou ignora
  - `birthday_messages_sent`: ignora se não houver tabela
  - `onboarded_collaborators`: `profiles` criados na unidade nos últimos 90d
  - `manual_pioneiro`: nunca incrementa via cron
- Upsert em `user_achievements`. Se cruzar threshold pela primeira vez → marca `completed=true, unlocked_at=now()` E enfileira `notification_events` (`type='achievement_unlocked'`, recipient_user_id).
- Retorna JSON `{users_processed, unlocks: [{user_id, code}]}`.
- Cron: `pg_cron` job diário 03:00 BRT (06:00 UTC) via `pg_net.http_post` com header `x-cron-secret`.

## 4. Frontend

### Hook `useAchievements.ts`
- `useMyAchievements()` → join achievements + user_achievements para auth.uid()
- `useUserAchievements(userId)` → respeita RLS
- `useAchievementsRanking(month, unitId?)` → top 10 by completed count no mês
- `useAdminAchievements()` → lista CRUD para master/admin
- `useUnlockToastListener()` → realtime em `user_achievements` filtrado pelo user pra disparar toast

### Componentes (`src/components/achievements/`)
- `AchievementCard.tsx` — ícone (lucide dinâmico), nome, descrição, barra %, lock state
- `AchievementToast.tsx` — toast animado + confeti (lib `canvas-confetti` se já houver, senão CSS) + botão "Compartilhar no feed"
- `AchievementsBadgeRow.tsx` — últimas 5 desbloqueadas (usado em MeuPerfil e ColaboradorPerfil)
- `AchievementFormModal.tsx` — admin CRUD

### Páginas
- `/perfil/conquistas` (`MinhasConquistas.tsx`) — grid por categoria + tabs Todas/Desbloqueadas/Em progresso/Bloqueadas
- `/conquistas/ranking` (`ConquistasRanking.tsx`) — só líderes; tabela top 10 do mês com filtro de unidade
- `/admin/conquistas` (`AdminConquistas.tsx`) — só master/admin; lista, toggle ativo, modal CRUD, botão "Marcar pioneiro" para usuários selecionados

### Realtime + push
- Listener em App-level (componente `AchievementUnlockListener` montado no layout) que escuta INSERT/UPDATE em `user_achievements` onde `user_id = me AND completed = true` → dispara `AchievementToast` + chama push se ainda não disparado.
- Push no servidor: já via `notification_events` enfileirado pela edge function (sistema existente lê e dispara).

## 5. Navegação

- `MeuPerfil.tsx`: já tem tabs — adiciona aba **Conquistas** apontando pra `/perfil/conquistas` (ou inline tab content).
- Sidebar:
  - `Ranking de Conquistas` → `/conquistas/ranking` no grupo Comunicação, só `isLider`
  - `Conquistas` no grupo Admin · RH → `/admin/conquistas`, só `isAdmin`/`isMaster`

## 6. Regras

- Migration única: tabelas + RLS + seed 15 achievements + helper + cron schedule (cron via `supabase--insert` separado pq usa URL/anon key).
- Sem mexer em RLS de outras tabelas.
- Graceful: cada bloco de métrica em try/catch; tabela inexistente = skip silencioso.
- Cron-only writes em `user_achievements`.

## 7. Arquivos tocados

**Novos:**
- `supabase/migrations/<ts>_achievements.sql`
- `supabase/functions/calculate-achievements/index.ts`
- `src/hooks/useAchievements.ts`
- `src/components/achievements/AchievementCard.tsx`
- `src/components/achievements/AchievementToast.tsx`
- `src/components/achievements/AchievementsBadgeRow.tsx`
- `src/components/achievements/AchievementFormModal.tsx`
- `src/components/achievements/AchievementUnlockListener.tsx`
- `src/pages/MinhasConquistas.tsx`
- `src/pages/ConquistasRanking.tsx`
- `src/pages/AdminConquistas.tsx`

**Editados:**
- `src/App.tsx` (3 rotas)
- `src/components/AppSidebar.tsx` (Ranking + Admin Conquistas)
- `src/components/AppLayout.tsx` (montar AchievementUnlockListener)
- `src/pages/MeuPerfil.tsx` (link/tab Conquistas)
- `src/pages/ColaboradorPerfil.tsx` (BadgeRow)
- `supabase/config.toml` (registrar função se necessário)
- `src/integrations/supabase/types.ts` (auto)
- `.lovable/plan.md`

Aprova pra eu executar?
