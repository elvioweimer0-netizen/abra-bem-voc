# Plano: FEEDBACK AO GERENTE (Espelho Trimestral)

Sistema anônimo trimestral para colaboradores avaliarem seus gerentes de loja em 5 dimensões. Anonimato garantido via hash irreversível server-side e view agregada com mínimo de 3 respostas.

## 1. Schema SQL (migração única)

### Tabelas
- **manager_feedback_cycles**: `year`, `quarter` (1-4), `closes_at`, `status` ('aberto','fechado','consolidado'). Unique `(year, quarter)`.
- **manager_feedback_questions**: `code` unique, `question_text`, `ordem`, `scale_min`/`scale_max`, `active`. Seed das 5 perguntas (`feedback_util`, `justo`, `ouve`, `acolhe`, `ensina`).
- **manager_feedback_responses**: `cycle_id`, `manager_user_id`, `respondent_hash` (text, gerado server-side), `question_id`, `score` (1-5), `comment`. Unique `(cycle_id, manager_user_id, respondent_hash, question_id)`.

### Segredo + função de hash
- Secret `MANAGER_FEEDBACK_SALT` (runtime) — usado pela função.
- Função `public.compute_feedback_hash(_user_id uuid, _cycle_id uuid)` SECURITY DEFINER:
  - `digest(salt || ':' || _user_id || ':' || _cycle_id, 'sha256')` em hex.
  - Salt lido de tabela interna `app_secrets` populada via migration (acessível só por admin) OU via `current_setting('app.feedback_salt', true)`. **Decisão:** criar `app_secrets(key text pk, value text)` com RLS bloqueada (sem policies) — função SECURITY DEFINER lê direto.
- Trigger BEFORE INSERT em `manager_feedback_responses` força `respondent_hash := compute_feedback_hash(auth.uid(), NEW.cycle_id)` (cliente NÃO controla).

### View agregada
- `v_manager_feedback_aggregated` com `security_invoker = true`:
  - SELECT manager_user_id, cycle_id, question_id, avg(score), count(*), jsonb por bucket de score (1-5).
  - Filtro `HAVING count(*) >= 3`.

### RLS
- **cycles**: SELECT autenticados; INSERT/UPDATE master/admin/supervisor.
- **questions**: SELECT autenticados; INSERT/UPDATE master/admin.
- **responses**:
  - INSERT: cycle aberto AND `manager_user_id` é gerente (gerente_loja/gerente) da mesma unidade do `auth.uid()` AND respondente NÃO é o próprio manager.
  - SELECT: bloqueado (sem policy) → ninguém lê linhas brutas. Apenas a view (que respeita RLS via security_invoker mas precisa de policy de SELECT na tabela). 
  - **Ajuste:** policy SELECT só para master/admin (auditoria) + a view será `security_definer` para agregação anônima (alternativa). 
  - **Decisão final:** view `security_invoker` + policy SELECT permitindo `master/admin/supervisor` e o próprio manager AGREGADO via função `get_manager_aggregated(...)` SECURITY DEFINER. Tabela continua bloqueada para todos exceto master.
  - **Refinado:** policy SELECT apenas master/admin. Função SECURITY DEFINER `fn_manager_feedback_aggregated(_manager_id, _cycle_id)` retorna agregados (com `count >= 3`) e é chamada pelo gerente, supervisor e admin. View para admins.

### Índices
- `(cycle_id, manager_user_id)`, `(manager_user_id)`.

## 2. Frontend

### Hooks
- `useActiveCycle()` — ciclo aberto atual.
- `useFeedbackQuestions()` — perguntas ativas.
- `useSubmitFeedback()` — batch insert de respostas.
- `useMyManager()` — descobre gerente_loja da unidade do user.
- `useManagerAggregated(managerId, cycleId)` — chama RPC.
- `useFeedbackCycles()` / `useAdminCycles()` — admin.

### Componentes
- `FeedbackBanner` (global, no AppLayout) — banner durante ciclo aberto, esconde se já respondeu.
- `FeedbackForm` — 5 perguntas com `RadioGroup` 1-5, comment opcional. Disclaimer de anonimato em destaque.
- `ManagerScoreCard` — card por pergunta com média + barras de distribuição.
- `TrendChart` — linha por pergunta ao longo dos ciclos (recharts).
- `ManagerComparison` — tabela comparativa para admin.

### Páginas/Rotas
- `/feedback-gerente` — formulário (colaborador/encarregado/lider_setor/fiscal).
- `/meu-feedback` — dashboard pro gerente_loja (agregado próprio).
- `/admin/feedback-gerentes` — comparativo (master/admin/supervisor).
- `/admin/feedback-gerentes/ciclos` — CRUD ciclos+perguntas.

### Sidebar
- "Feedback ao gerente" pra elegíveis.
- "Meu feedback" pra gerentes_loja.
- Item admin pra master/admin/supervisor.

## 3. Ética & anonimato
- Hash NUNCA exposto ao cliente; gerado em trigger.
- Disclaimer no formulário: "Seu gerente nunca verá quem respondeu. Apenas médias agregadas com mínimo de 3 respostas são exibidas."
- View/RPC esconde resultados se `count < 3` ("aguardando mais respostas").
- Comentários exibidos sem qualquer metadado (apenas texto, embaralhados aleatoriamente).

## 4. Arquivos tocados

**Criados:**
- `supabase/migrations/<ts>_manager_feedback.sql`
- `src/hooks/useManagerFeedback.ts`
- `src/components/feedback/FeedbackBanner.tsx`
- `src/components/feedback/FeedbackForm.tsx`
- `src/components/feedback/ManagerScoreCard.tsx`
- `src/components/feedback/FeedbackTrendChart.tsx`
- `src/pages/FeedbackGerentePage.tsx`
- `src/pages/MeuFeedbackPage.tsx`
- `src/pages/AdminFeedbackGerentesPage.tsx`
- `src/pages/AdminFeedbackCiclosPage.tsx`

**Editados:**
- `src/App.tsx` (rotas)
- `src/components/AppSidebar.tsx`
- `src/components/AppLayout.tsx` (banner global)
- `src/integrations/supabase/types.ts` (auto)

## 5. Secret necessário
Vou pedir o secret **MANAGER_FEEDBACK_SALT** (string aleatória forte) **antes** de rodar a migration, pra inserir no `app_secrets`.

Aprova pra executar?
