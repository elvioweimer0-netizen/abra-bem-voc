# Plano: REPOSIÇÃO ENTRE LOJAS (cobertura emergencial)

Objetivo: permitir que gerentes de loja solicitem cobertura emergencial e que colaboradores de outras unidades (que se voluntariaram) recebam convites e aceitem turnos.

---

## 1. Schema SQL (migration única)

### Alterações em `profiles`
- `available_for_coverage boolean not null default false`
- `coverage_dates daterange[] null` — janelas de datas em que o colaborador topa ser convidado.

### Nova tabela `coverage_requests`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid pk | gen_random_uuid() |
| requester_gerente_id | uuid fk profiles(id) | gerente solicitante |
| requester_unit_id | uuid fk units(id) | loja que precisa |
| target_date | date not null | |
| target_shift_start | time not null | |
| target_shift_end | time not null | |
| setor | text | |
| urgency | text check in ('alta','média','baixa') | |
| accepted_by_user_id | uuid fk profiles(id) null | |
| status | text check in ('aberto','aceito','recusado','cancelado','concluido') default 'aberto' | |
| message | text | |
| created_at | timestamptz default now() | |
| updated_at | timestamptz default now() | trigger |

### Nova tabela `coverage_invites` (1 request → N convites)
Necessária para rastrear quem foi convidado individualmente, push de aceite/recusa por convite, e evitar duplicatas.
| Campo | Tipo |
|---|---|
| id | uuid pk |
| request_id | uuid fk coverage_requests on delete cascade |
| invitee_user_id | uuid fk profiles |
| status | text check ('pendente','aceito','recusado','cancelado') default 'pendente' |
| responded_at | timestamptz null |
| created_at | timestamptz default now() |
| unique(request_id, invitee_user_id) |

Índices: `(invitee_user_id, status)`, `(request_id)`, `coverage_requests(status, target_date)`.

### Triggers
- `tg_coverage_invite_notify` (AFTER INSERT em `coverage_invites`) → insere em `notification_events` (push para colaborador convidado).
- `tg_coverage_invite_response_notify` (AFTER UPDATE de status) → push para gerente solicitante.
- Quando invite vira `aceito`: atualiza `coverage_requests.status='aceito'` e `accepted_by_user_id`; cancela demais invites pendentes do mesmo request.
- `tg_coverage_achievement` (AFTER UPDATE em coverage_requests para `concluido`): conta coberturas concluídas do `accepted_by_user_id`; se ≥3, insere badge "Salvador" em `user_achievements` (se já existir tabela) ou na estrutura de achievements vigente.

---

## 2. RLS

### profiles
- Não alterar políticas existentes. Apenas garantir que UPDATE próprio (já existente) permite tocar `available_for_coverage` e `coverage_dates`. Não criar novas policies se já há "users update own profile".

### coverage_requests
- **SELECT**: requester (`requester_gerente_id = auth.uid()`) OR usuários com `profiles.available_for_coverage = true` OR admins via `has_role`.
- **INSERT**: usuários com role `gerente_loja` (via `has_role`), `requester_gerente_id = auth.uid()`.
- **UPDATE**: `requester_gerente_id = auth.uid()` (cancelar/concluir) OR `accepted_by_user_id = auth.uid()`.
- **DELETE**: somente requester com status='aberto'.

### coverage_invites
- **SELECT**: `invitee_user_id = auth.uid()` OR requester do request relacionado.
- **INSERT**: requester do request (gerente_loja).
- **UPDATE**: `invitee_user_id = auth.uid()` (aceitar/recusar) OR requester (cancelar).

---

## 3. Frontend

### Hooks novos
- `useCoverageProfile()` — read/update `available_for_coverage` + `coverage_dates`.
- `useCoverageRequests()` — list/create requests do gerente.
- `useAvailableHelpers(date, shift)` — busca profiles com `available_for_coverage=true`, fora da unit do gerente, cujo `coverage_dates` cobre `date`.
- `useMyCoverageInvites()` — convites recebidos pelo usuário logado.
- `useInviteHelpers()` — mutation que cria N `coverage_invites`.
- `useRespondInvite()` — aceitar/recusar.

### Páginas/componentes
- **Edit em `/perfil`**: bloco "Disponibilidade para cobertura" — toggle + multi-select de intervalos de datas (componente `CoverageAvailabilityEditor.tsx` usando date-range picker do shadcn).
- **`/reposicao`** (gerente_loja): `ReposicaoPage.tsx`
  - Formulário (`NovaCoberturaForm.tsx`): data, horário início/fim, setor, urgência, mensagem.
  - Após submit/cria request: lista de candidatos em `HelperCandidateCard.tsx` (nome, unit, telefone/email, badge urgência). Botão "Convidar" → cria invite.
  - Lista de requests anteriores do gerente com status.
- **`/minhas-coberturas`** (todos os colaboradores): `MinhasCoberturasPage.tsx`
  - Tabs: "Convites pendentes" | "Aceitas" | "Histórico".
  - `InviteCard.tsx` com aceitar/recusar.
- **Conquista "Salvador"**: badge desbloqueado server-side via trigger; UI exibe no perfil/conquistas existentes.

### Rotas (`src/App.tsx`)
- `/reposicao` → `ReposicaoPage` (gerente_loja, admin, master).
- `/minhas-coberturas` → `MinhasCoberturasPage` (autenticado).

### Sidebar (`AppSidebar.tsx`)
- Link "Reposição" para gerente_loja+.
- Link "Minhas coberturas" para todos.

---

## 4. Push notifications (via `notification_events` existente)
- Convite criado → push ao colaborador convidado.
- Invite aceito/recusado → push ao gerente requester.
- Lembrete 2h antes do turno coberto: nova edge function **`coverage-tick`** (cron a cada 15min) varre `coverage_requests` com status `aceito`, `target_date+target_shift_start` entre agora+1h55 e agora+2h05, ainda não lembrados (campo `reminded_at timestamptz` em coverage_requests). Insere notification_events para `accepted_by_user_id`.
- Cron registrado via `supabase--insert` (não migration) para não vazar URL/anon em remix.

---

## 5. Conquista "Salvador"
- Trigger conta `coverage_requests` com `accepted_by_user_id = X AND status='concluido'`.
- Ao atingir 3, insere badge na estrutura de achievements existente. (Vou inspecionar tabela atual antes de migrar; se não existir tabela formal, crio `user_achievements(user_id, code, unlocked_at)` mínima; senão reaproveito.)

---

## 6. Arquivos tocados (previsão)

**Migration:**
- `supabase/migrations/<timestamp>_coverage_between_stores.sql`

**Edge function:**
- `supabase/functions/coverage-tick/index.ts`

**Cron (via insert tool, não migration):** agendamento `coverage-tick-every-15min`.

**Hooks (novos):**
- `src/hooks/useCoverageProfile.ts`
- `src/hooks/useCoverageRequests.ts`
- `src/hooks/useAvailableHelpers.ts`
- `src/hooks/useMyCoverageInvites.ts`

**Componentes (novos):**
- `src/components/coverage/CoverageAvailabilityEditor.tsx`
- `src/components/coverage/NovaCoberturaForm.tsx`
- `src/components/coverage/HelperCandidateCard.tsx`
- `src/components/coverage/InviteCard.tsx`

**Páginas (novas):**
- `src/pages/ReposicaoPage.tsx`
- `src/pages/MinhasCoberturasPage.tsx`

**Editados:**
- `src/App.tsx` (rotas)
- `src/components/AppSidebar.tsx` (links)
- `src/pages/<página de edição de perfil>` (encaixar `CoverageAvailabilityEditor`) — confirmar arquivo exato ao executar.
- `supabase/config.toml` (registrar função `coverage-tick`)
- `src/integrations/supabase/types.ts` (auto após migration)
- `.lovable/plan.md`

---

## 7. Riscos / decisões
- **Conquista "Salvador"**: dependo de inspecionar a estrutura de achievements atual. Se não houver, crio tabela mínima `user_achievements` no mesmo migration.
- **`daterange[]`**: arrays de range são suportados em Postgres; query de disponibilidade usará `EXISTS (SELECT 1 FROM unnest(coverage_dates) r WHERE target_date <@ r)`.
- **Não mexer em RLS de outras tabelas** ✅ (apenas profiles UPDATE próprio já existe; não recrio).
- **Único commit reversível**: tudo em uma migration + arquivos novos.

Aprova pra executar?
