
# Plano: Escala de Turnos Visual

Conflito detectado: já existem `work_schedules` + `shift_assignments` + `shift_swap_requests` em uso por `EscalaSemana.tsx` e `attendance_records` (modelo `team_members` + `week_start`/`day_of_week`). Para evitar regressão, **crio tabelas novas com nomes diferentes** e deixo o sistema legado intocado.

## 1. Schema (migração única)

### Tabela `shifts` (novo nome para evitar colisão)
- `id` uuid pk
- `user_id` uuid → profiles.user_id ON DELETE CASCADE (NOT NULL)
- `unit_id` uuid → units (NOT NULL)
- `setor` text
- `shift_date` date NOT NULL
- `shift_start` time NOT NULL
- `shift_end` time NOT NULL
- `role_in_shift` text
- `status` text CHECK ('agendado','realizado','falta','folga') DEFAULT 'agendado'
- `notes` text
- `created_by` uuid → profiles.user_id
- `created_at`, `updated_at` timestamptz
- Índices: `(unit_id, shift_date)`, `(user_id, shift_date DESC)`

### Tabela `shift_swaps` (novo nome)
- `id` uuid pk
- `original_shift_id` uuid → shifts ON DELETE CASCADE
- `requester_user_id` uuid → profiles.user_id
- `swap_with_user_id` uuid → profiles.user_id (nullable)
- `message` text
- `status` text CHECK ('aberto','aceito','recusado','aprovado_gerente','cancelado') DEFAULT 'aberto'
- `responded_at` timestamptz
- `created_at` timestamptz
- Índice: `(status)`

### RLS

**shifts**
- SELECT: `user_id = auth.uid()` OR `is_unit_manager(auth.uid(), unit_id)` OR `has_role admin/master/supervisor`
- INSERT/UPDATE/DELETE: `is_unit_manager(auth.uid(), unit_id)` OR admin

**shift_swaps**
- SELECT: requester OR swap_with OR gerente da unit do shift original
- INSERT: `requester_user_id = auth.uid()` E é dono do `original_shift_id`
- UPDATE: swap_with OR gerente da unit OR requester (pra cancelar)

### Triggers (notificações via `notification_events`)
- `tg_shift_swap_request_notify`: ao criar swap → notifica gerente da unit + colega proposto (`swap_with_user_id`).
- `tg_shift_swap_status_notify`: ao mudar status → notifica requester.
- `tg_set_updated_at` em shifts.

### Lembrete 1h antes
- Edge function `shifts-tick` (cron 5/5 min): seleciona shifts em `[now()+55min, now()+65min]` ainda sem flag `reminded_at`. Adiciono coluna `reminded_at timestamptz` em shifts. Insere notification_events tipo `shift_reminder`.
- Cron via `pg_cron` + `pg_net` (insert tool, não migration).

## 2. Frontend

### Hooks novos
- `useShifts(unitId, range)` — grid gerente
- `useMyShifts(days=14)` — vista pessoal
- `useShiftMutations()` — create/update/delete/move
- `useShiftSwaps()` — listar/criar/responder
- `useUnitTeam(unitId)` — colaboradores da unit (de profiles)

### Componentes
- `src/components/shifts/ShiftGrid.tsx` — grid colaboradores × dias com células coloridas por setor; drag-and-drop nativo HTML5; conflitos (overlap mesmo user) destacados em vermelho.
- `src/components/shifts/CoverageChart.tsx` — barras por hora (recharts) embaixo do grid.
- `src/components/shifts/NovoTurnoModal.tsx` — select user/data/horário/setor/role.
- `src/components/shifts/SolicitarTrocaModal.tsx` — escolhe colega + msg.
- `src/components/shifts/ShiftCell.tsx` — célula com cor por setor.
- `src/components/shifts/MyShiftCard.tsx` — card de turno pessoal.

### Páginas/rotas
- `/escala` (gerente_loja, gerente_adm) — grid semanal/mensal por unidade, toggle semana/mês, seletor de unidade pra quem tem múltiplas, NovoTurnoModal, gráfico de cobertura.
- `/minha-escala` (todos) — próximos 14 dias em lista + botão trocar.
- `/escala/admin` (master/admin) — visão consolidada das 7 unidades (cards por unidade com mini-grid + KPIs: turnos/semana, cobertura média, swaps pendentes).

### Sidebar
- "Escala de turnos" → `/escala` (gerentes)
- "Minha escala" → `/minha-escala` (todos)
- "Escala (admin)" → `/escala/admin` (master/admin)

Mantém o item legado **Escala da Semana** (`/escala-semana`) intacto.

## 3. Detalhes técnicos

- **Drag-and-drop**: HTML5 nativo (sem libs novas). Drop em outra célula chama mutation `update shift_date/user_id`.
- **Conflitos**: cliente detecta overlap (`shift_start < other.end && shift_end > other.start` mesmo user/data) → borda vermelha + tooltip.
- **Cobertura**: agrupa por unit+date, conta usuários ativos hora a hora (0-23) → BarChart.
- **Push**:
  - Lembrete 1h antes: edge function `shifts-tick` + cron 5min.
  - Swap pedido → trigger insere notification_events pra gerente + colega.
  - Swap respondido → trigger insere pra requester.
- **Edge function** `shifts-tick`:
  - `verify_jwt = false` em config.toml
  - service_role client, busca shifts em janela, marca `reminded_at`, insere notifications.

## 4. Arquivos tocados

**Criados:**
- `supabase/migrations/<ts>_shifts_visual.sql`
- `supabase/functions/shifts-tick/index.ts`
- `src/hooks/useShifts.ts`
- `src/hooks/useMyShifts.ts`
- `src/hooks/useShiftSwaps.ts`
- `src/hooks/useUnitTeam.ts`
- `src/components/shifts/ShiftGrid.tsx`
- `src/components/shifts/ShiftCell.tsx`
- `src/components/shifts/CoverageChart.tsx`
- `src/components/shifts/NovoTurnoModal.tsx`
- `src/components/shifts/SolicitarTrocaModal.tsx`
- `src/components/shifts/MyShiftCard.tsx`
- `src/pages/EscalaPage.tsx`
- `src/pages/MinhaEscalaPage.tsx`
- `src/pages/EscalaAdminPage.tsx`

**Editados:**
- `src/App.tsx` (3 rotas novas)
- `src/components/AppSidebar.tsx` (3 itens)
- `supabase/config.toml` (verify_jwt shifts-tick)
- `src/integrations/supabase/types.ts` (auto)

## 5. Reversibilidade

Migração única em transação. Rollback = `DROP TABLE shifts CASCADE; DROP TABLE shift_swaps CASCADE; DROP FUNCTION ...;` + remover cron job + reverter arquivos. Zero impacto em `work_schedules`/`shift_assignments`/`shift_swap_requests`/`attendance_records` legados.

Aprova pra executar?
