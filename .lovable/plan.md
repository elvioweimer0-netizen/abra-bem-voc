# Plano: Marcos Automáticos de Tempo de Casa

Feature que detecta e celebra automaticamente aniversários de tempo de Curió (1, 3, 5, 10, 20 anos), promoções e primeiro dia. Distinto dos aniversários de nascimento.

## 1. Schema (migration única)

**Tabela `milestone_celebrations`:**
- `id uuid pk default gen_random_uuid()`
- `user_id uuid not null` → `profiles.user_id` ON DELETE CASCADE
- `milestone_type text not null` CHECK in (`1_year`,`3_years`,`5_years`,`10_years`,`20_years`,`promotion`,`first_day`)
- `milestone_date date not null`
- `celebrated_at timestamptz default now()`
- `praise_id uuid` → `praises.id` ON DELETE SET NULL
- `post_visible boolean default true`
- UNIQUE (`user_id`, `milestone_type`, `milestone_date`)
- Index em `milestone_date` pra widget "próximos 7 dias"

**RLS:**
- ENABLE RLS
- SELECT: `auth.role() = 'authenticated'`
- INSERT/UPDATE/DELETE: somente admin/master (edge function usa service role e bypass)

**Conquista nova:** seed `veterano_curio_1`, `_3`, `_5`, `_10`, `_20` em `achievements` (tier escalando bronze→ouro→diamante).

## 2. Edge Function `detect-milestones`

- `verify_jwt = false` (cron-only)
- Schedule: cron diário 06:30 BRT (09:30 UTC) via `pg_cron` + `pg_net`
- Lógica:
  1. Busca profiles ativos com `data_admissao IS NOT NULL`
  2. Pra cada um: calcula `years = age(today, data_admissao)` em anos exatos
  3. Se anos ∈ {1,3,5,10,20} E hoje é exatamente o aniversário de admissão:
     - Verifica unique key não existe em `milestone_celebrations`
     - Cria `praises` (autor = primeiro user com role master, destinatario = user, mensagem = "{nome} completa {N} anos no Curió! 🎉", `praise_type='equipe_externa'`, categoria nova `aniversario_curio`)
     - Insere `milestone_celebrations` linkando `praise_id`
     - Insere `user_achievements` correspondente
     - Enfileira `notification_events` tipo `milestone_anniversary` pro user + equipe da unidade

**Observação sobre limite diário de praise:** trigger `validate_daily_praise_limit` pode bloquear. Solução: edge function usa service role e o trigger só roda uma vez por destinatário/dia — ok porque é 1 marco por dia.

## 3. Frontend

**3.1 `MeuPerfil.tsx`:** banner dourado no topo se hoje há marco do user.
- Hook `useMyMilestoneToday()` query `milestone_celebrations` where user_id=me, milestone_date=today.

**3.2 Widget `MilestonesWeekWidget.tsx` no Feed (`Index.tsx`):**
- Query próximos 7 dias de `milestone_celebrations` + join profile (nome, avatar, unidade)
- Lista compacta: "{nome} • {N} anos • {data}"

**3.3 `/admin/milestones` (`MilestonesAdmin.tsx`):**
- Lista paginada de marcos (filtro por unidade/tipo/data)
- Botão "Forçar marco" (modal: escolhe user + tipo + data → chama edge function com flag `force=true`)
- Botão "Cancelar" (set `post_visible=false` + soft hide do praise)
- Acesso restrito: admin/master

**3.4 Rota:** adiciona em `App.tsx` + entrada no `AppSidebar.tsx` (seção admin).

## 4. Push notifications

- Reusa `notification_events` (sistema atual já dispara push). Tipo novo `milestone_anniversary`.
- Destaque no feed por 24h: query do widget já filtra `milestone_date >= today - 1 day`.

## 5. Diferenciação de aniversário de nascimento

- Aniversariantes (`data_nascimento`) = card existente, intacto.
- Marcos = `data_admissao`, fonte separada, widget e banner distintos (cor dourada vs rosa).

## Arquivos tocados

**Criados:**
- `supabase/migrations/<ts>_milestones.sql`
- `supabase/functions/detect-milestones/index.ts`
- `src/hooks/useMyMilestoneToday.ts`
- `src/hooks/useUpcomingMilestones.ts`
- `src/components/milestones/MilestoneBanner.tsx`
- `src/components/milestones/MilestonesWeekWidget.tsx`
- `src/pages/MilestonesAdmin.tsx`

**Editados:**
- `src/App.tsx` (rota)
- `src/components/AppSidebar.tsx` (link admin)
- `src/pages/MeuPerfil.tsx` (banner)
- `src/pages/Index.tsx` (widget no feed)
- `supabase/config.toml` (verify_jwt=false pra função)
- `src/integrations/supabase/types.ts` (auto)

**SQL data ops (insert tool):**
- Cron job `detect-milestones-daily` em `pg_cron`
- Seed de achievements `veterano_curio_*`

## Riscos

- Trigger `validate_daily_praise_limit`: ok, marco é 1x.
- `data_admissao` ausente em muitos profiles → função apenas pula.
- Cron precisa de `pg_cron`/`pg_net` habilitados (já existem no projeto, presumido).

Aprova pra executar?