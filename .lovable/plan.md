# Plano — ONBOARDING CULTURAL "Como o Curió faz"

Trilha de 30 dias com cápsulas obrigatórias para novos colaboradores/líderes de setor, com progresso visual, certificado "Cidadão Curió" e painel de acompanhamento pra RH/gerentes.

## 1. Schema (migration única)

**Alteração `training_modules`**
- `ALTER TABLE training_modules ADD COLUMN onboarding_track boolean NOT NULL DEFAULT false`
- Índice parcial: `(onboarding_track) WHERE onboarding_track = true`

**Tabela `onboarding_journeys`**
- `id uuid PK`
- `user_id uuid` → `profiles(user_id) ON DELETE CASCADE` UNIQUE (1 jornada por user)
- `started_at timestamptz NOT NULL DEFAULT now()`
- `expected_completion_date date GENERATED ALWAYS AS ((started_at::date + interval '30 days')::date) STORED`
- `completed_at timestamptz NULL`
- `total_modules int NOT NULL` (snapshot na criação)
- `completed_modules int NOT NULL DEFAULT 0`
- `status text NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento','concluido','atrasado'))`
- `last_activity_at timestamptz NULL` (pra coluna "último acesso" no admin)
- `created_at`, `updated_at`

## 2. Triggers/Functions

**`tg_create_onboarding_journey`** (AFTER INSERT em `profiles`)
- Só dispara se `cargo IN ('colaborador','lider_setor')`
- Conta módulos `active=true AND onboarding_track=true` → grava em `total_modules`
- Insere `onboarding_journeys` com `ON CONFLICT DO NOTHING`
- Enfileira `notification_events` tipo `onboarding_welcome` pro novo user

**`tg_update_journey_on_completion`** (AFTER INSERT em `training_completions`)
- Se módulo é `onboarding_track=true` e user tem journey ativa:
  - Recalcula `completed_modules` (count distinct sobre completions×modules onboarding)
  - Atualiza `last_activity_at = now()`
  - Se `completed_modules >= total_modules` → `status='concluido'`, `completed_at=now()`
  - Notifica gerente da unidade (`onboarding_completed`) e enfileira badge `cidadao_curio` em `notification_events` (achievements são unlockados via listener existente)

**`tg_journey_status_recalc`** (BEFORE UPDATE)
- Se `expected_completion_date < CURRENT_DATE` AND `status='em_andamento'` → `'atrasado'` (também aplicado pelo cron)

**Cron diário** `onboarding-status-cron` (pg_cron + pg_net) às 03:30
- UPDATE journeys SET status='atrasado' WHERE status='em_andamento' AND expected_completion_date < CURRENT_DATE
- Notifica gerentes das unidades dos atrasados (`onboarding_late`)
- Lembrete semanal: pra journeys `em_andamento` cujo `last_activity_at < now()-7d`, push pro user

## 3. RLS `onboarding_journeys`

- SELECT próprio: `user_id = auth.uid()`
- SELECT líder unidade: `is_leadership(auth.uid()) AND EXISTS (profiles p WHERE p.user_id=onboarding_journeys.user_id AND user_can_access_unit(auth.uid(), p.unit_id))`
- SELECT moderador RH/admin: `is_rh_or_admin(auth.uid())`
- INSERT/UPDATE/DELETE: nenhuma policy (só via SECURITY DEFINER triggers)

## 4. Frontend

**Hook `useOnboarding.ts`**
- `useMyJourney()`: jornada do usuário + lista de módulos onboarding com status (locked/unlocked/in_progress/completed) — desbloqueio sequencial por `ordem`
- `useJourneysAdmin(filters)`: listagem para painel RH
- `useUnitOnboardings(unitId)`: pra widget gerente_loja
- `useToggleOnboardingTrack()`: admin treinamento
- `useResendIncentive(userId)`: insere notification_event manual

**Páginas**
- `/onboarding` — trilha visual em "caminho" (steps verticais com conector). Reusa `/treinamento/:id` no click. Ao concluir → componente `CertificadoCidadaoCurio` com animação confetti + botão "Compartilhar no feed" (cria entrada em `noticias` ou `aviso`/feed simples; se não der, abre share nativo)
- `/admin/onboarding` — tabs "Em andamento | Atrasados | Concluídos", filtro por unidade, botão "Reenviar incentivo"

**Componentes** (`src/components/onboarding/`)
- `OnboardingProgressBanner.tsx` — banner topo Dashboard, esconde se concluído ou se user não tem jornada
- `OnboardingTrailStep.tsx` — step da trilha
- `CertificadoCidadaoCurio.tsx`
- `NovosNoTimeWidget.tsx` — pra dashboard gerente_loja
- `JourneyRow.tsx` — linha admin

**Integrações**
- `Dashboard.tsx` ou `FeedColaborador.tsx`: insere `<OnboardingProgressBanner />` no topo
- `AdminTreinamento.tsx`: switch "Faz parte do onboarding"
- Painel gerente_loja (Dashboard): `<NovosNoTimeWidget />`

## 5. Notificações (via `notification_events`)
- `onboarding_welcome` — no insert do profile
- `onboarding_weekly_reminder` — cron
- `onboarding_completed` — pro autor + pro gerente da unidade
- `onboarding_late` — pro gerente quando passa 30 dias
- `onboarding_incentive` — botão admin

## 6. Navegação (`AppSidebar.tsx`)
- "Onboarding" — visível pra qualquer user **enquanto sua jornada está em andamento** (chamada extra ao hook leve)
- "Admin · Onboarding" — visível se `is_rh_or_admin` (master/admin/gerente_adm RH); guard de rota com `RhAdminOnly`
- `App.tsx`: rotas `/onboarding` e `/admin/onboarding`

## 7. Conquistas
- Reusa achievements existentes: garante código `cidadao_curio` (cria via insert idempotente se não existir; mentor_1 já existe).
- Unlock acionado pelo trigger ao concluir (insere em `notification_events` tipo `achievement_unlock` que o `AchievementUnlockListener` já consome) — alternativamente insere direto em `user_achievements` se a tabela existir e for compatível. **Conferir esquema antes**; se houver função pública `unlock_achievement(uid,code)`, usar; senão, apenas notification.

## 8. Seed
- Coluna pronta. Seed de 10 cápsulas vem depois pelo usuário (separado).

## Arquivos tocados (previsão)

**Criados**
- `supabase/migrations/<ts>_onboarding_cultural.sql`
- `src/hooks/useOnboarding.ts`
- `src/pages/Onboarding.tsx`
- `src/pages/AdminOnboarding.tsx`
- `src/components/onboarding/OnboardingProgressBanner.tsx`
- `src/components/onboarding/OnboardingTrailStep.tsx`
- `src/components/onboarding/CertificadoCidadaoCurio.tsx`
- `src/components/onboarding/NovosNoTimeWidget.tsx`
- `src/components/onboarding/JourneyRow.tsx`

**Editados**
- `supabase/insert/<ts>_cron.sql` (via insert tool — cron job)
- `src/App.tsx` (rotas + guard)
- `src/components/AppSidebar.tsx` (itens menu)
- `src/pages/Dashboard.tsx` ou `FeedColaborador.tsx` (banner + widget gerente)
- `src/pages/AdminTreinamento.tsx` (toggle onboarding_track)
- `src/integrations/supabase/types.ts` (auto)
- `.lovable/plan.md`

## Regras respeitadas
- Migration única reversível
- Reusa `training_modules`/`training_completions`
- Trigger restrito a `colaborador`/`lider_setor`
- Nenhuma RLS de outras tabelas é alterada
- Validação client + check constraints

Aprova pra eu executar?
