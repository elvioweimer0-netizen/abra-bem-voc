# Pré-Pauta Automática da Reunião 9:30

Geração automática (06:25 BRT, antes do push das 09:25) de uma pauta sugerida para o Daily Huddle de cada gerente de loja, baseada em sinais da unidade nas últimas 24h. Gerente revisa, edita ou aceita; após reunião, vê histórico do que foi usado.

## 1) Migration SQL (única)

Arquivo: `supabase/migrations/<ts>_huddle_pre_pauta.sql`

```sql
ALTER TABLE public.daily_huddle_reports
  ADD COLUMN IF NOT EXISTS suggested_agenda jsonb,
  ADD COLUMN IF NOT EXISTS final_agenda text,
  ADD COLUMN IF NOT EXISTS agenda_used boolean NOT NULL DEFAULT false;
```

Sem mudanças em RLS de outras tabelas. RLS já existente em `daily_huddle_reports` cobre os novos campos.

Estrutura JSON de `suggested_agenda`:
```json
{
  "tempo_estimado_min": 15,
  "generated_at": "2026-...",
  "topicos": [
    { "tipo": "alerta|reconhecimento|decisao",
      "titulo": "string",
      "acao_sugerida": "string",
      "deep_link": "/rota/no/app",
      "fonte": "heatmap|compromissos|pdi|aniversarios|avisos|curio_ouro" }
  ]
}
```

## 2) Edge Function `generate-meeting-agenda`

Arquivo: `supabase/functions/generate-meeting-agenda/index.ts` + entrada em `supabase/config.toml` (`verify_jwt = false`, chamada por cron com service role).

Para cada `unit` de loja ativa:
- Identifica gerentes ativos (cargo `gerente_loja`/`gerente`) — opcional, basta gerar 1 pauta por unidade (chave única `unit_id + report_date`).
- Coleta sinais (todos com try/catch individuais — graceful):
  - **Heatmap**: `fn_heatmap_indicators('hoje')` → top 3 piores indicadores não-zero da unidade → tipo `alerta`.
  - **Compromissos vencendo hoje**: `weekly_commitments` com `due_date = today` e status pendente → `decisao`, deep link `/compromissos`.
  - **PDI próximo do prazo**: `pdi_goals` da unidade com prazo ≤ 7 dias e não concluídas → `decisao`, deep link `/pdi`.
  - **Aniversariantes do dia**: `profiles.data_nascimento` filtrando dia/mês → `reconhecimento`, deep link `/`.
  - **Avisos importantes não lidos**: `avisos` urgentes da unidade ainda sem leitura por parte da equipe → `alerta`, deep link `/avisos/:id`.
  - **Curió de Ouro recente** (últimos 7 dias): última premiação → `reconhecimento`, deep link `/curio-de-ouro`.
- Limita a ~6 tópicos no total (priorizando alertas críticos).
- Calcula `tempo_estimado_min` ≈ 2min por tópico, mínimo 10, máximo 20.
- Faz `upsert` em `daily_huddle_reports (unit_id, report_date)` com `suggested_agenda` (NÃO sobrescreve campos do gerente como `bo_dia`, `final_agenda`, `agenda_used`).
- Após gerar, dispara `notification_events` tipo `huddle_agenda_ready` para gerentes da unidade (push 09:25 — vide §4).

Cron diário (segunda a sexta) 09:25 BRT (12:25 UTC) via `pg_cron + pg_net`. Se LLM ou queries falharem em features ausentes, função segue e salva o que conseguiu.

## 3) Frontend

### 3.1 `/daily-huddle` — Card "Pauta sugerida pelo Curiozinho"

Arquivos:
- **novo** `src/components/daily-huddle/SuggestedAgendaCard.tsx`:
  - Mostra tópicos como lista com checkbox + ícone por `tipo` (alerta vermelho, decisao âmbar, reconhecimento verde) + chip da `fonte`.
  - Cada tópico clicável navega via `deep_link` (abre em nova aba se necessário).
  - Botão **"Usar essa pauta"** → preenche `final_agenda` (texto markdown gerado dos tópicos selecionados) e seta `agenda_used = true`.
  - Botão **"Editar"** abre `<Textarea>` para o gerente personalizar (salva em `final_agenda` + `agenda_used = true`).
  - Estado vazio: "Sem pauta sugerida hoje (Curiozinho ainda não rodou ou unidade sem sinais)".
- **edit** `src/hooks/useDailyHuddle.ts`: adicionar campos `suggested_agenda`, `final_agenda`, `agenda_used` ao tipo `HuddleReport` + nova mutação `useSetHuddleAgenda(unitId, payload)`.
- **edit** `src/pages/DailyHuddle.tsx`: renderizar `SuggestedAgendaCard` acima do `DailyHuddleForm` quando houver `suggested_agenda` ou `final_agenda`.

### 3.2 Pós-reunião

- Quando `agenda_used = true` E reunião finalizada (heurística: dia anterior ou flag manual), o `SuggestedAgendaCard` entra em modo readonly mostrando "Pauta usada" + lista dos tópicos.
- Indicadores de cumprimento: para cada tópico de fonte `compromissos`/`pdi`, consulta o status atual e mostra ✓ concluído / ⏳ pendente. Implementação simples: comparar `deep_link` ID com tabelas-fonte.

## 4) Push

- Disparado pela própria edge function após gerar pauta (`notification_events.type = 'huddle_agenda_ready'`).
- Conteúdo: "📋 Pauta da reunião 9:30 tá pronta no app", deep link `/daily-huddle`.
- Reaproveita pipeline de notificações existente (mesmo padrão do `daily-huddle-reminders`). Sem novo código de push.

## Cron

Via `supabase--insert` (não migration — contém URL/anon key específicos):
```sql
select cron.schedule(
  'generate-meeting-agenda-daily',
  '25 12 * * 1-5',  -- 09:25 BRT, seg-sex
  $$ select net.http_post(
       url := '<func-url>',
       headers := '{"Content-Type":"application/json","apikey":"<anon>"}'::jsonb,
       body := '{}'::jsonb
     ); $$
);
```

## Arquivos tocados (resumo)

Criados:
- `supabase/migrations/<ts>_huddle_pre_pauta.sql`
- `supabase/functions/generate-meeting-agenda/index.ts`
- `src/components/daily-huddle/SuggestedAgendaCard.tsx`

Editados:
- `src/hooks/useDailyHuddle.ts` (tipo + mutação)
- `src/pages/DailyHuddle.tsx` (renderiza card)
- `supabase/config.toml` (registra função)
- `src/integrations/supabase/types.ts` (auto)

Cron schedule via `supabase--insert` (separado).

## Garantias

- Commit único reversível: 1 migration + 1 função + 3 arquivos front.
- Não toca RLS de outras tabelas.
- Cada coletor de sinal isolado em try/catch — se feature X não existir, ignora e segue.
- Função idempotente (upsert por `unit_id + report_date`, preserva campos do gerente).

Aprova?
