# Plano: Mentoria Informal ("Tô aberto a conversar")

Sistema peer-to-peer de mentoria onde qualquer colaborador declara tópicos sobre os quais aceita conversar, e outros pedem mentoria via chat curto.

## 1. Schema (migration única)

**`mentorship_topics`** — catálogo seed
- `id uuid pk`, `code text unique`, `name text`, `icon text`, `ordem smallint default 0`, `active boolean default true`
- Seed: Vendas, Estoque, Atendimento, Liderança, Padaria, Açougue, FLV, Frente de Caixa, Carreira no Curió, Lidar com cliente difícil

**`user_mentorship_offers`**
- `id uuid pk`, `user_id uuid → profiles(user_id) on delete cascade`, `topic_id uuid → mentorship_topics on delete cascade`, `message text`, `active boolean default true`, `created_at timestamptz default now()`
- UNIQUE (`user_id`, `topic_id`)
- Index em `topic_id` e `user_id`

**`mentorship_requests`**
- `id uuid pk`, `requester_user_id uuid → profiles(user_id) cascade`, `mentor_user_id uuid → profiles(user_id) cascade`, `topic_id uuid → mentorship_topics cascade`, `message text not null`, `status text check (aberto/aceito/recusado/concluido) default 'aberto'`, `mentor_response text`, `created_at timestamptz default now()`, `responded_at timestamptz`
- Index em (`mentor_user_id`, `status`) e (`requester_user_id`, `status`)

## 2. RLS

- `mentorship_topics`: SELECT autenticados; ALL admin/master
- `user_mentorship_offers`: SELECT autenticados; INSERT/UPDATE/DELETE só dono (`user_id = auth.uid()`)
- `mentorship_requests`:
  - SELECT: requester OR mentor
  - INSERT: `requester_user_id = auth.uid()` E requester != mentor
  - UPDATE: `mentor_user_id = auth.uid()` (aceita/recusa) OU requester (concluir após aceito)

## 3. Triggers

- `tg_mentorship_request_notify`: AFTER INSERT → `notification_events` tipo `mentorship_request` pro mentor
- `tg_mentorship_status_notify`: AFTER UPDATE quando status muda → `notification_events` tipo `mentorship_response` pro requester

## 4. Frontend

**4.1 Edit perfil — `MentorshipOffersEditor.tsx`**
- Lista de tópicos com checkbox + textarea opcional por seleção
- Salva diff em `user_mentorship_offers`
- Inserido em `MeuPerfil` (modal de edição) ou aba dedicada

**4.2 `/mentoria` — `MentoriaPage.tsx`**
- Lista de mentores (profiles com offers ativas), filtros por tópico/unidade
- Card: avatar + nome + cargo + unidade + chips de tópicos + botão "Pedir conversa"

**4.3 `NovaMentoriaModal.tsx`**
- Select tópico (limitado aos do mentor) + textarea (mensagem) → cria request

**4.4 `/minhas-mentorias` — `MinhasMentoriasPage.tsx`**
- Tabs "Pediram" (mentor) / "Pedi" (requester)
- Mentor: botões Aceitar/Recusar (modal com mensagem opcional) e visualizar
- Requester: ver status, botão "Marcar concluído" se aceito

**4.5 Rotas em `App.tsx`** + entradas em `AppSidebar.tsx` (visível pra todos)

## 5. Push

- Reusa `notification_events` (sistema atual já dispara push):
  - `mentorship_request`: "Pediram sua mentoria sobre {tópico}"
  - `mentorship_response`: "{Mentor} {aceitou/recusou} sua conversa sobre {tópico}"

## Arquivos tocados

**Criados:**
- `supabase/migrations/<ts>_mentorship.sql`
- `src/hooks/useMentorshipTopics.ts`
- `src/hooks/useMentors.ts`
- `src/hooks/useMyMentorships.ts`
- `src/components/mentorship/MentorshipOffersEditor.tsx`
- `src/components/mentorship/NovaMentoriaModal.tsx`
- `src/components/mentorship/MentorCard.tsx`
- `src/pages/MentoriaPage.tsx`
- `src/pages/MinhasMentoriasPage.tsx`

**Editados:**
- `src/App.tsx` (rotas `/mentoria`, `/minhas-mentorias`)
- `src/components/AppSidebar.tsx` (links)
- `src/pages/MeuPerfil.tsx` (seção offers ou link pra editor)
- `src/integrations/supabase/types.ts` (auto)

**SQL data ops:** seed de `mentorship_topics` (10 tópicos) — feito dentro da migration.

Aprova pra executar?