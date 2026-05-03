# Humorômetro + Pulso Semanal

Dois sinais de clima organizacional: mood diário (1-5) e pergunta livre semanal (sexta). Líderes só veem agregados — nunca user_id.

## 1. Schema (migration única)

**`daily_mood`**
- `id uuid pk`, `user_id uuid → profiles(user_id) ON DELETE CASCADE`, `unit_id uuid → units ON DELETE CASCADE`
- `score smallint CHECK (score BETWEEN 1 AND 5)` (nullable quando `skipped=true`)
- `skipped boolean DEFAULT false`, `note text`, `recorded_at timestamptz DEFAULT now()`
- Unique index parcial em `(user_id, (recorded_at::date))`.

**`pulse_questions`**
- `id`, `week_start_date date UNIQUE` (segunda-feira), `question_text text`, `active boolean DEFAULT true`, `created_at`.

**`pulse_answers`**
- `id`, `question_id → pulse_questions ON DELETE CASCADE`, `user_id → profiles(user_id) ON DELETE CASCADE`
- `unit_id → units`, `answer_text text` (≤500 chars validado client + check), `answered_at timestamptz DEFAULT now()`
- Unique `(question_id, user_id)`.

## 2. RLS + helper

Função `public.can_view_climate(_user_id uuid, _unit_id uuid)` retorna true se master/admin/supervisor/gerente_adm OU `is_unit_manager(_user_id, _unit_id)`. Reutilizada nas views.

**daily_mood**
- INSERT/DELETE: `user_id = auth.uid()`.
- SELECT: apenas `user_id = auth.uid()`. Agregado para líderes vai pelas views.

**pulse_questions**
- SELECT: todo autenticado (precisa ler a pergunta da semana).
- INSERT/UPDATE/DELETE: master/admin.

**pulse_answers**
- INSERT: `user_id = auth.uid()`.
- SELECT: apenas `user_id = auth.uid()`. Líderes leem só via view (sem user_id).
- Sem UPDATE/DELETE.

## 3. Views agregadas (security_invoker = off, owner postgres)

**`v_mood_aggregate`** — `unit_id, setor, day, avg_score, count`
- Filtra `daily_mood` ignorando skipped, agrupa por unit/setor/dia.
- WHERE `public.can_view_climate(auth.uid(), unit_id)` na própria view.

**`v_pulse_aggregate`** — `question_id, week_start_date, question_text, unit_id, answer_text, answered_at`
- Sem `user_id`. WHERE `public.can_view_climate(auth.uid(), unit_id)`.
- Adiciono ORDER BY `answered_at` (não revela ordem de chegada por pessoa pois sem id de user).

Conferi `is_unit_manager` já cobre gerente/gerente_loja/gerente_adm/admin/master/supervisor — bate com o pedido.

## 4. Frontend

**Hooks globais** (montados no `AppLayout`):
- `useDailyMoodPrompt`: ao logar/abrir, checa se `daily_mood` do dia existe pro user; se não, dispara `<MoodPrompt>`. localStorage `mood_prompt_dismissed_<yyyy-mm-dd>` evita reabrir após "Pular".
- `usePulseWeekly`: se hoje é sexta E existe `pulse_questions` ativa da semana E user ainda não respondeu, abre `<PulsePrompt>`. Mesmo padrão de dismiss.

**Componentes**:
- `MoodPrompt.tsx` — Dialog com 5 botões (😞😕😐🙂😄 / Péssimo–Ótimo), textarea opcional, botão "Pular hoje".
- `PulsePrompt.tsx` — Dialog com a pergunta + textarea (máx 500), enviar/dispensar.

**Páginas**:
- `/clima` (líderes elegíveis) — `Clima.tsx`
  - Filtro por unidade (escopo `useAccessibleUnits`).
  - Recharts LineChart `avg_score × dia` (últimos 30d).
  - Tabela "Pulso da semana" com filtro semana/unidade, lista answer_text anônima.
  - Alerta visual: badge vermelho quando `avg_score < 3` em 2+ dias consecutivos por unidade.
- `/admin/clima` (master/admin apenas) — `AdminClima.tsx`
  - Form criar/editar pergunta semanal (date picker da segunda-feira), tabela histórico.

**Sidebar**: novo item "Clima" para master/admin/supervisor/gerente_loja/gerente_adm. Item "Admin · Clima" só master/admin.

## 5. Arquivos a tocar

**Migration**: `supabase/migrations/<ts>_climate.sql`

**Criar**:
- `src/hooks/useDailyMoodPrompt.ts`, `src/hooks/usePulseWeekly.ts`, `src/hooks/useClimateAccess.ts`
- `src/components/clima/MoodPrompt.tsx`, `PulsePrompt.tsx`, `MoodChart.tsx`, `PulseTable.tsx`
- `src/pages/Clima.tsx`, `src/pages/AdminClima.tsx`

**Editar**:
- `src/App.tsx` (rotas `/clima`, `/admin/clima`)
- `src/components/AppLayout.tsx` (montar prompts globais)
- `src/components/AppSidebar.tsx` (item Clima)

## 6. Garantias
- Views são o único caminho pra líderes — `user_id` nunca sai do banco.
- Migration única e reversível; nenhuma RLS de outra tabela alterada.
- Sem dependência de Treinamento/Organograma; coexiste com features atuais.

Aprova pra eu rodar a migration e implementar?