# PDI dos Encarregados — Plano de Implementação

Feature de Plano de Desenvolvimento Individual (PDI) por trimestre, com metas atribuídas pelo gerente ao encarregado, atualizações de progresso e visão consolidada para liderança.

---

## 1. Schema SQL (migration única)

### Tabela `pdi_goals`
```
id uuid PK default gen_random_uuid()
encarregado_user_id uuid NOT NULL  -- FK profiles(user_id) ON DELETE CASCADE
gerente_user_id     uuid           -- FK profiles(user_id) ON DELETE SET NULL
unit_id             uuid           -- FK units(id)
trimestre smallint NOT NULL CHECK (trimestre BETWEEN 1 AND 4)
ano       smallint NOT NULL CHECK (ano >= 2025)
titulo    text NOT NULL CHECK (length(titulo) BETWEEN 5 AND 100)
descricao text NOT NULL
meta_valor    numeric
meta_unidade  text
valor_atual   numeric
status text NOT NULL DEFAULT 'em_andamento'
       CHECK (status IN ('em_andamento','atingida','parcialmente_atingida','nao_atingida','cancelada'))
prazo date
created_at timestamptz default now()
updated_at timestamptz default now()
closed_at  timestamptz
```
Index: `(encarregado_user_id, trimestre, ano)`. Trigger `update_updated_at_column` no UPDATE.

### Tabela `pdi_progress_updates`
```
id uuid PK
goal_id uuid NOT NULL  -- FK pdi_goals ON DELETE CASCADE
autor_user_id uuid NOT NULL  -- FK profiles(user_id)
valor_atual numeric
observacao text NOT NULL
created_at timestamptz default now()
```
Index: `(goal_id, created_at desc)`. Trigger ao inserir: atualiza `pdi_goals.valor_atual` e `updated_at`.

---

## 2. RLS

### `pdi_goals`
- **INSERT**: `gerente_user_id = auth.uid()` AND líder (`gerente_loja|master|admin|supervisor`) AND `user_can_access_unit(auth.uid(), unit_id)`
- **SELECT**: dono (encarregado), autor (gerente), `master|admin|supervisor`, ou `gerente_loja` com `user_can_access_unit`
- **UPDATE**: mesmo critério SELECT restrito a autor original ou líder
- **DELETE**: só `master|admin`

### `pdi_progress_updates`
- **INSERT**: `autor_user_id = auth.uid()` AND tem acesso ao goal (encarregado dono ou líder elegível via SELECT do goal)
- **SELECT**: mesmo critério SELECT do goal pai
- **UPDATE/DELETE**: bloqueado (sem policy permissiva)

Helper SQL: `can_view_pdi_goal(_uid uuid, _goal uuid)` security definer pra reutilizar nas policies de updates.

---

## 3. Frontend

### Páginas
- `src/pages/Pdi.tsx` → `/pdi` (encarregado/lider_setor/colaborador): cards das próprias metas do trimestre atual, filtro de trimestre/ano, click abre drawer detalhe + timeline + botão "Adicionar atualização".
- `src/pages/PdiEquipe.tsx` → `/pdi/equipe` (gerente_loja, encarregado): lista equipe com até 3 metas resumo + status; botão "Nova meta pra X".
- `src/pages/PdiAdmin.tsx` → `/pdi/admin` (master/admin/supervisor): tabela consolidada com filtros loja/trimestre/ano/status, expansão por linha.

### Componentes (`src/components/pdi/`)
- `PdiGoalCard.tsx` — barra de progresso (`valor_atual / meta_valor`), badge de status, badge "atrasada" (vermelho) se `prazo < today` e status `em_andamento`.
- `PdiGoalForm.tsx` — modal: encarregado select (filtrado por unit acessível), trimestre/ano default = atual, título (5–100), descrição, meta_valor, meta_unidade, prazo.
- `PdiProgressForm.tsx` — modal: textarea + valor opcional.
- `PdiProgressTimeline.tsx` — lista cronológica dos updates.
- `PdiGoalDetailDrawer.tsx` — junta tudo.

### Hook
- `src/hooks/usePdi.ts`: `useMyGoals`, `useTeamGoals`, `useAdminGoals(filters)`, `useGoalUpdates(goalId)`, `useCreateGoal`, `useAddProgress`, `useUpdateGoalStatus`.

---

## 4. Navegação (`AppSidebar.tsx`)
- "PDI" → `/pdi` (encarregado, lider_setor, colaborador)
- "PDI da Equipe" → `/pdi/equipe` (gerente_loja, encarregado)
- "PDI · Visão Geral" → `/pdi/admin` (master, admin, supervisor) — na seção "Análise" existente.

---

## 5. Push / Notificações
- Trigger `tg_pdi_notify_new_goal` AFTER INSERT em `pdi_goals` → insere em `notification_events` (`type='pdi_new_goal'`) pro encarregado.
- Edge function agendada `pdi-trimestre-cleanup` (cron diário): no 1º dia de cada trimestre, encontra metas do trimestre anterior com status `em_andamento` e dispara push pro `gerente_user_id` (`type='pdi_overdue_goal'`).

---

## 6. Routing & Guards
- `App.tsx`: 3 rotas novas com guards via `useUserRole`/profile. Componente `PdiAdminAccess` análogo ao `HeatmapAccess`.

---

## Arquivos tocados
**Criados**
- `supabase/migrations/<ts>_pdi.sql`
- `supabase/functions/pdi-trimestre-cleanup/index.ts`
- `src/hooks/usePdi.ts`
- `src/components/pdi/PdiGoalCard.tsx`
- `src/components/pdi/PdiGoalForm.tsx`
- `src/components/pdi/PdiProgressForm.tsx`
- `src/components/pdi/PdiProgressTimeline.tsx`
- `src/components/pdi/PdiGoalDetailDrawer.tsx`
- `src/pages/Pdi.tsx`
- `src/pages/PdiEquipe.tsx`
- `src/pages/PdiAdmin.tsx`

**Editados**
- `src/App.tsx` (rotas + guard)
- `src/components/AppSidebar.tsx` (3 itens)
- `src/integrations/supabase/types.ts` (auto)
- `.lovable/plan.md`

**Cron job**: `pdi-trimestre-cleanup-daily` agendado via `pg_cron` (insert tool, não migration).

---

Aprova pra eu executar?
