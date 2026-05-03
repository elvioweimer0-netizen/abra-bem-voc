# Pergunta da Semana pro Líder — Plano

Ritual semanal de reflexão para liderança: master/admin posta pergunta na segunda, líderes respondem até quarta 23:59, depois discussão aberta com comentários. Mecanismo anti-contágio: só vê respostas dos outros após submeter a sua.

---

## 1) Banco (migration única)

### `leadership_questions`
- `week_start_date date UNIQUE NOT NULL` (segunda-feira)
- `question_text text` (CHECK 20–500)
- `context_note text`
- `target_roles text[]` default `{master,admin,supervisor,gerente_loja,gerente_adm}`
- `deadline_date date NOT NULL` (default = `week_start_date + 2 dias` = quarta)
- `created_by`, `active`, timestamps

### `leadership_answers`
- `question_id` FK cascade
- `user_id` FK cascade
- `answer_text` (CHECK 50–2000)
- `submitted_at`, `edited_at`
- UNIQUE `(question_id, user_id)`

### `leadership_answer_comments`
- `answer_id` FK cascade, `author_user_id`, `comment_text` (CHECK 5–500)
- INDEX `(answer_id, created_at desc)`

### Funções helper (SECURITY DEFINER, search_path=public)
- `is_eligible_for_leadership_question(_uid, _question_id) bool` — cargo do user ∈ target_roles
- `user_already_answered(_uid, _question_id) bool`
- `question_deadline_passed(_question_id) bool`

### RLS

**leadership_questions**
- SELECT: `is_eligible_for_leadership_question(auth.uid(), id) OR has_role(admin/master/supervisor)`
- INSERT/UPDATE/DELETE: master/admin/supervisor

**leadership_answers**
- INSERT: `user_id=auth.uid()` AND elegível
- SELECT: própria OU (elegível AND `user_already_answered(auth.uid(), question_id)`) OU master/admin/supervisor
- UPDATE: própria AND `now() <= deadline_date + 23:59:59`
- DELETE: bloqueado

**leadership_answer_comments**
- SELECT: pode ver a answer
- INSERT: `author_user_id=auth.uid()` AND pode ver answer AND `question_deadline_passed` (comentário só após deadline)
- UPDATE: bloqueado
- DELETE: autor OU master/admin

---

## 2) Frontend

### Hook `src/hooks/useLeadershipQuestions.ts`
- `useCurrentLeadershipQuestion()` — pergunta da semana ativa
- `useLeadershipQuestionHistory({ from, to, authorId })`
- `useLeadershipAnswers(questionId)` — vazia se user ainda não respondeu (RLS faz isso); flag `userHasAnswered`
- `useMyAnswer(questionId)`
- `useSubmitAnswer()` / `useEditAnswer()`
- `useAnswerComments(answerId)` / `useAddComment()` / `useDeleteComment()`
- `useAdminLeadershipQuestions()` (lista com stats) / `useSaveQuestion()`

### Páginas
- **`/pergunta-semana`** (`PerguntaSemana.tsx`)
  - Topo: question card grande com `context_note`, countdown até deadline
  - Se ainda não respondeu E dentro do deadline: textarea + contador caracteres + Submeter
  - Se respondeu: mostra resposta + Editar (até deadline)
  - Banner "Responda pra ver as respostas dos colegas" antes de submeter
  - Após submissão (ou após deadline): lista de respostas dos outros em Accordion + comentários (só após deadline)
- **`/pergunta-semana/historico`** (`PerguntaSemanaHistorico.tsx`)
  - Lista de perguntas passadas, filtros período + autor
- **`/pergunta-semana/:questionId`** (`PerguntaSemanaDetalhe.tsx`)
  - Visão completa de uma pergunta histórica + todas as respostas + comentários
- **`/admin/pergunta-semana`** (`AdminPerguntaSemana.tsx`, master/admin/supervisor)
  - Form criar pergunta (com seleção de target_roles, week_start_date, deadline)
  - Lista futuras + stats (% respostas, top engajamento)

### Componentes (`src/components/leadership-questions/`)
- `QuestionCard.tsx`
- `QuestionCountdown.tsx`
- `AnswerForm.tsx`
- `AnswerList.tsx` + `AnswerItem.tsx`
- `LeadershipAnswerComments.tsx`
- `QuestionFormModal.tsx` (admin)

### Navegação (`AppSidebar.tsx`)
- Item "Pergunta da Semana" para cargos em target_roles default (master/admin/supervisor/gerente_loja/gerente_adm)
- Sub-item "Admin · Perguntas" só master/admin/supervisor

### Rotas em `App.tsx`
- 3 rotas + 1 admin com guards

---

## 3) Push / lembretes

Edge function `leadership-question-reminders` (POST, sem JWT) chamada por pg_cron 4x:
- Seg 9h: envia notification_event "Pergunta da semana chegou" pra todos elegíveis
- Ter 16h: lembrete pra quem ainda não respondeu
- Qua 18h: "última chance" pra quem não respondeu
- Qua 23:59: relatório pro autor (quantos responderam / não)

Cron registrado em sql separado via insert tool (contém URL/anon key — não usar migration).

---

## 4) Anti-contágio

Garantido **na RLS**: SELECT em `leadership_answers` exige `user_already_answered` (exceto a própria, autor da pergunta, e admin/supervisor). Não dá pra fraudar pelo client.

---

## 5) Arquivos previstos

**Criar:**
- `supabase/migrations/<ts>_leadership_questions.sql`
- `supabase/functions/leadership-question-reminders/index.ts`
- `src/hooks/useLeadershipQuestions.ts`
- `src/pages/PerguntaSemana.tsx`
- `src/pages/PerguntaSemanaHistorico.tsx`
- `src/pages/PerguntaSemanaDetalhe.tsx`
- `src/pages/AdminPerguntaSemana.tsx`
- `src/components/leadership-questions/` (6 componentes acima)

**Editar:**
- `src/App.tsx` (4 rotas + guard)
- `src/components/AppSidebar.tsx` (seção)
- `.lovable/plan.md`

**Pós-aprovação (separado, via insert tool):** SQL do pg_cron com URL real do projeto.

Aprova?
