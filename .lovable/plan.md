# Plano: Alerta de Risco de Churn (predição)

Sistema de detecção precoce de risco de saída de colaboradores, com sinais comportamentais agregados, score ponderado, recomendações via IA e fluxo ético de tratamento.

## 1. Schema SQL (migration única)

**Tabela `churn_risk_signals`**
- `id` uuid pk default gen_random_uuid()
- `user_id` uuid → profiles(user_id) on delete cascade (alvo)
- `unit_id` uuid → units(id) nullable
- `calculated_at` date not null default current_date
- `risk_score` numeric(5,2) check (0–100)
- `signals` jsonb (array de `{code, weight, detail}`)
- `recommended_action` text
- `gerente_notified_at` timestamptz nullable
- `status` text default `'ativo'` check in (`ativo`, `resolvido_1on1`, `resolvido_outro`, `falso_positivo`, `colaborador_saiu`)
- `resolution_note` text nullable
- `resolved_by` uuid nullable
- `resolved_at` timestamptz nullable
- `created_at`, `updated_at` timestamptz
- UNIQUE (`user_id`, `calculated_at`)
- Index (`unit_id`, `calculated_at desc`), (`status`, `calculated_at desc`)

**RLS:**
- SELECT: `is_rh_or_admin(auth.uid())` OR `has_role(auth.uid(),'supervisor')` OR (`has_role(auth.uid(),'gerente_loja')` AND `user_can_access_unit(auth.uid(), unit_id)`)
- INSERT/UPDATE/DELETE pelo client: bloqueado (sem policy permissiva). Edge function usa service role.
- UPDATE permitido só pra coluna de resolução via RPC `resolve_churn_risk(_id, _status, _note)` SECURITY DEFINER, restrito aos mesmos perfis.

**Não toca RLS de outras tabelas.**

## 2. Edge Function `calculate-churn-risk` (cron diário 05:00)

`verify_jwt = false`. Service role. Para cada profile ativo com cargo em `colaborador, encarregado, lider_setor, fiscal`:

Sinais coletados (últimos 30 dias, cada um envolto em try/catch — se a tabela não existe, ignora):

| código | peso | regra |
|---|---|---|
| `humor_baixo_5d` | 25 | `daily_mood` média < 3 nos últimos 5 dias com ≥3 registros |
| `advertencia_30d` | 30 | qualquer `advertencias` em 30d |
| `sem_kudos_30d` | 10 | nenhum `praises` recebido em 30d |
| `leitura_baixa` | 10 | <30% de `aviso_reads` em avisos da unidade nos últimos 30d |
| `sem_huddle_atendimento` | 10 | nenhuma participação em `daily_huddles`/leitura em 14d |
| `sem_acesso_7d` | 15 | `last_sign_in_at` (auth.users via admin) ou `login_count` estagnado >7d |

Score = soma dos pesos disparados (cap 100).

Se score ≥ 50: upsert em `churn_risk_signals` (por `user_id, calculated_at=today`). Chama Lovable AI Gateway (`google/gemini-2.5-flash`) com prompt curto pra gerar `recommended_action` (1–2 frases, foco em conversa 1:1, sem rotular). Falha graceful → fallback "Sugerir conversa 1:1 essa semana."

Notificações:
- Se novo registro (não existia ontem): notifica gerente_loja da unidade (`notification_events` type `churn_risk_new`).
- Se `gerente_notified_at` > 7d sem mudança de status: notifica RH (`churn_risk_unattended`).

## 3. Cron

`pg_cron` + `pg_net` POST diário 05:00 BRT pra edge function. SQL com URL e anon key via `supabase--insert` (não migration).

## 4. Frontend

**Hook `useChurnRisk.ts`**: query lista + por user.

**Página `/admin/risco-churn`** (acesso: master/admin/supervisor/gerente_adm-RH):
- Tabela: nome, unidade, score (badge cor), top sinais (chips), status, ação recomendada, dias desde detecção
- Filtros: unidade, status (default `ativo`)
- Disclaimer ético no topo (componente `ChurnEthicsDisclaimer`)
- Link pra detalhe

**Página `/risco-churn/:user_id`**:
- Histórico cronológico de scores
- Sinais detalhados
- Botões: "Marcar resolvido após 1:1", "Resolvido (outro motivo)", "Falso positivo", "Colaborador saiu" — cada um abre modal com observação obrigatória → chama RPC

**Widget `ChurnAtencaoWidget`** no Dashboard pra `gerente_loja`:
- Top 3 da equipe com risco ativo
- Card compacto, link pra detalhe

**Rotas em `App.tsx`**: `/admin/risco-churn`, `/risco-churn/:userId` com guards.

**Sidebar**: item "Risco de churn" pra perfis autorizados.

## 5. Push

Reaproveita `notification_events` + service worker existente. Tipos novos: `churn_risk_new`, `churn_risk_unattended`. `silent: false` (barulhento, é crítico).

## 6. Ética

- Componente `ChurnEthicsDisclaimer` visível em todas as telas: "Sinais preditivos, não determinísticos. Conversa antes de qualquer decisão. Histórico mantido para auditoria."
- Colaborador-alvo NÃO vê seu próprio score (RLS bloqueia, sem rota acessível)
- Falsos positivos ficam visíveis no histórico

## Arquivos a tocar

**Criar:**
- `supabase/migrations/<ts>_churn_risk_signals.sql`
- `supabase/functions/calculate-churn-risk/index.ts`
- `src/hooks/useChurnRisk.ts`
- `src/pages/AdminRiscoChurn.tsx`
- `src/pages/RiscoChurnDetalhe.tsx`
- `src/components/churn/ChurnEthicsDisclaimer.tsx`
- `src/components/churn/ChurnAtencaoWidget.tsx`
- `src/components/churn/ResolverChurnModal.tsx`

**Editar:**
- `supabase/config.toml` (registrar função, `verify_jwt = false`)
- `src/App.tsx` (rotas + guards)
- `src/components/AppSidebar.tsx` (item de menu)
- `src/pages/Dashboard.tsx` (montar widget pra gerente_loja)
- `src/integrations/supabase/types.ts` (auto-regenerado)

**Cron via insert tool** (não migration): `cron.schedule('calculate-churn-risk-daily', '0 8 * * *', net.http_post(...))` — 08:00 UTC = 05:00 BRT.

## Regras respeitadas
- Commit único reversível
- Cron diário, não realtime
- Graceful degradation por sinal
- Não mexe em RLS de outras tabelas
- Disclaimer ético em toda UI
