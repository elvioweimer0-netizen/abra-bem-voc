# Score do Gerente — KPI Composto

Sistema mensal de pontuação composta (0–100) para gerentes/encarregados, calculado por edge function cron, com 8 dimensões ponderadas, ranking, breakdown e admin de pesos. Cálculo robusto: dimensão sem dados é ignorada e seu peso é redistribuído entre as ativas.

## 1. Schema (migration única)

**`manager_score_dimensions`** (catálogo + pesos)
- `code` (slug único), `name`, `description`, `weight` (0–100), `metric_query_name`, `active`, `ordem`
- Seed das 8 dimensões com pesos somando 100:
  - `disciplina_operacional` 18 — % checklists completos
  - `comunicacao` 10 — leitura de avisos (gerente + equipe)
  - `lideranca_ativa` 12 — daily huddles / dias úteis
  - `cumprimento_compromissos` 15 — weekly commitments cumpridos
  - `cultura` 10 — Curió de Ouro dados/recebidos (normalizado)
  - `disciplina_disciplinar` 10 — advertências invertidas
  - `engajamento_equipe` 15 — mood médio × 20
  - `desenvolvimento` 10 — cápsulas (gerente + média equipe)

**`manager_scores_monthly`**
- `user_id`, `year`, `month`, `unit_id`, `final_score`, `dimension_breakdown` (jsonb com `{code: {raw, weight_used, weighted}}`), `calculated_at`, `notes`
- UNIQUE (user_id, year, month); índices (year, month, final_score desc) e (unit_id, year, month)

## 2. RLS

- **`manager_score_dimensions`**: SELECT master/admin/supervisor/gerente_loja/gerente_adm; mutações apenas master/admin
- **`manager_scores_monthly`**: SELECT próprio OR master/admin/supervisor; sem INSERT/UPDATE pelo client (edge function usa service role)

## 3. Edge function `calculate-manager-scores`

Loop em profiles com cargo IN (`gerente_loja`,`gerente_adm`,`encarregado`), referência = mês anterior.

Pra cada dimensão ativa, executa cálculo correspondente em try/catch. Se a tabela de origem não existir ou falhar → dimensão marcada como `skipped`, peso redistribuído proporcionalmente entre as restantes.

```text
score_final = Σ (raw_dim × weight_redistribuído / 100)
```

Persiste em `manager_scores_monthly` (UPSERT por user/year/month). Envia push:
- `manager_score_calculated` pro próprio gerente
- `manager_score_top_bottom` pro Roberto/Guga (top 1 e bottom 1)

**Cron**: dia 1 de cada mês às 04:00 (`pg_cron` + `pg_net` chamando a função).

## 4. Frontend

### 4.1 `/meu-score` (gerente_loja, gerente_adm, encarregado)
- Hero card: score do mês anterior + delta vs mês anterior anterior
- LineChart (recharts) tendência últimos 6 meses
- Grid de cards por dimensão: valor, peso, mini-barra, comparativo média da rede
- Box "Onde focar essa semana": dimensão mais fraca + link contextual (ex: cápsulas → `/treinamento`)
- Disclaimer ético em destaque

### 4.2 `/scores/ranking` (master/admin/supervisor)
- Tabela ranqueada: posição, avatar+nome, unidade, score, 8 mini-barras coloridas (breakdown), seta de tendência
- Filtros: mês, ano, unidade
- Click em linha abre Drawer com detalhe (reusa componentes do /meu-score)
- LineChart comparativo dos top 5 últimos 6 meses

### 4.3 `/admin/score-dimensions` (master/admin)
- Lista editável: drag para reordenar, toggle active, input weight
- Validação client-side: soma pesos ativos = 100 (badge vermelho/verde)
- Botão "Preview de impacto": dry-run recalculando últimos 3 meses no client com novos pesos sobre `dimension_breakdown` salvo, mostrando delta médio
- Salvar persiste novos pesos (não recalcula histórico — apenas próximo cron)

## 5. Disclaimer & Ética

Componente `<ScoreEthicsDisclaimer />` reutilizável, fixado em `/meu-score` e `/scores/ranking`:

> "O Score é insumo de avaliação, não veredicto. A conversa contextual continua essencial pra decisões de RH."

Histórico nunca deletado: sem rota/UI de delete; RLS impede DELETE.

## 6. Navegação (`AppSidebar.tsx`)

- "Meu Score" (Gauge icon) pra `gerente_loja`/`gerente_adm`/`encarregado` na seção Gestão
- "Ranking de Gerentes" pra master/admin/supervisor na seção Análise
- "Admin · Score" pra master/admin na seção Admin

## 7. Detalhes técnicos

- Edge function usa `SUPABASE_SERVICE_ROLE_KEY` para bypassar RLS na escrita
- Graceful degradation: cada dimensão é função interna isolada com try/catch que retorna `null` → ignorada
- Redistribuição: `peso_efetivo = peso_original × (100 / soma_pesos_ativos_com_dado)`
- Cron job criado via `supabase--insert` (contém URL/anon key, não migration)
- Mood: usa `daily_mood` se existir; senão skip
- Curió de Ouro normalizado: min-max scaling sobre rede no mesmo mês
- Push: usa `notification_events` existente (mesmo padrão das outras features)

## Arquivos a criar/editar

**Criar**:
- `supabase/migrations/<ts>_manager_scores.sql` (tabelas + RLS + seed)
- `supabase/functions/calculate-manager-scores/index.ts`
- `src/hooks/useManagerScore.ts`
- `src/components/scores/ScoreEthicsDisclaimer.tsx`
- `src/components/scores/ScoreHeroCard.tsx`
- `src/components/scores/ScoreTrendChart.tsx`
- `src/components/scores/ScoreDimensionCard.tsx`
- `src/components/scores/ScoreMiniBars.tsx`
- `src/components/scores/ScoreDetailDrawer.tsx`
- `src/pages/MeuScore.tsx`
- `src/pages/ScoresRanking.tsx`
- `src/pages/AdminScoreDimensions.tsx`

**Editar**:
- `src/App.tsx` (rotas + guards)
- `src/components/AppSidebar.tsx` (3 itens de menu)

**Pós-aprovação separada (insert tool, não migration)**: agendamento `pg_cron` chamando a edge function dia 1 às 04:00.

Aprova pra eu executar?