# Plano: CLIENTE MISTERIOSO DIGITAL

Permite a gerentes, supervisores e admins visitarem outras unidades de forma anônima e avaliarem por critérios padronizados. Quando a visita é anônima, o gerente da unidade visitada NÃO descobre quem visitou.

---

## 1. Schema SQL (migration única)

### Tabelas

**`mystery_visit_criteria`** (catálogo de critérios)
- `id uuid pk`, `code text unique`, `name text`, `ordem smallint`, `active boolean default true`, `created_at`
- SEED: `atendimento`, `limpeza_loja`, `organizacao_estoque`, `fila_caixa`, `qualidade_produto`, `sinalizacao_promo`, `vestimenta_equipe`, `postura_equipe`

**`mystery_visits`**
- `id uuid pk`
- `visitor_user_id uuid → profiles.id` (id do PERFIL, não auth.uid; mantém padrão das outras tabelas)
- `target_unit_id uuid → units.id NOT NULL`
- `visit_date date NOT NULL`
- `visit_time time NULL`
- `anonymous_to_team boolean NOT NULL DEFAULT true`
- `overall_score numeric(3,1) CHECK (overall_score IS NULL OR (overall_score BETWEEN 0 AND 10))` (calculado por trigger a partir dos scores 1-5 → escala 0-10)
- `notes text`, `photos jsonb DEFAULT '[]'::jsonb`
- `created_at timestamptz default now()`, `updated_at`
- Index: `(target_unit_id, visit_date DESC)`, `(visitor_user_id, visit_date DESC)`

**`mystery_visit_scores`**
- `id uuid pk`
- `visit_id uuid → mystery_visits ON DELETE CASCADE`
- `criteria_id uuid → mystery_visit_criteria`
- `score smallint CHECK (score BETWEEN 1 AND 5)`
- `comment text`
- UNIQUE `(visit_id, criteria_id)`

### Triggers
- `tg_mvs_recalc_overall` (AFTER INSERT/UPDATE/DELETE em `mystery_visit_scores`): recalcula `overall_score = avg(score) * 2` (para ficar em 0-10).
- `tg_mystery_visit_notify` (AFTER INSERT em `mystery_visits` + reaproveita após recálculo via INSERT no scores): roda quando overall_score finaliza:
  - Se `anonymous_to_team = false`: notifica gerentes da `target_unit_id` ("Você foi visitado, score X").
  - Se `overall_score < 6`: notifica supervisores/admins/master + nomes específicos (Roberto, Guga) — usando padrão já existente no código (lower(nome) LIKE '%roberto%'/'%guga%').

### Bucket Storage
- `INSERT INTO storage.buckets (id, name, public) VALUES ('mystery-photos','mystery-photos', false)` (privado).
- Policies em `storage.objects`:
  - SELECT: visitante dono OU master/admin/supervisor (excluindo gerente da unidade alvo se anônimo — verificado via lookup do path `{visit_id}/...`).
  - INSERT: visitante autenticado (qualquer gerente/supervisor/admin) — primeiro segmento do path = visit_id válido pertencente ao usuário.
  - DELETE: dono ou admin/master.
  - Para evitar lookup recursivo complexo, usar regra simplificada: SELECT permitido para visitor + admin/master/supervisor; gerentes da unidade alvo NÃO conseguem ler (não têm role admin/master/supervisor). O sigilo do "quem" fica no row (visitor_user_id) que o gerente target nunca consegue SELECT.

---

## 2. RLS

### `mystery_visit_criteria`
- SELECT: authenticated (todos).
- INSERT/UPDATE/DELETE: admin/master.

### `mystery_visits`
- **INSERT**: `visitor_user_id = coverage_profile_id_for(auth.uid())` AND visitor cargo IN (`gerente_loja`,`gerente_adm`,`gerente`,`supervisor`,`admin`,`master`).
- **SELECT**: 
  - visitor (sempre vê suas próprias visitas), OU
  - admin/master/supervisor (sempre veem tudo), OU
  - gerentes da target_unit_id **somente quando** `anonymous_to_team = false` (e mesmo assim a coluna `visitor_user_id` é uma id de perfil — mas para cumprir o requisito de nunca expor quem, criaremos uma view `mystery_visits_for_targets` que omite `visitor_user_id` para esse caso, ou retornaremos via RPC. Solução escolhida: **não permitir SELECT direto pra gerentes target**; eles recebem apenas push notification quando `anonymous_to_team=false`. Assim o anonimato fica blindado a nível de RLS — gerentes target nunca acessam a row.)
- **UPDATE**: visitor (próprio), admin/master.
- **DELETE**: admin/master.

### `mystery_visit_scores`
- **SELECT**: quem pode ver a visita (mesmo critério via subquery EXISTS).
- **INSERT/UPDATE/DELETE**: visitor da visita pai OU admin/master.

### Storage `mystery-photos`
- SELECT/INSERT/DELETE: visitor + admin/master/supervisor.

---

## 3. Frontend

### Hooks
- `useMysteryCriteria` — lista catálogo ativo.
- `useMysteryVisits({ unitId?, visitorId?, from?, to? })` — lista filtrada.
- `useMysteryVisit(id)` — detalhe + scores.
- `useCreateMysteryVisit` — cria visita + scores + upload de fotos.
- `useMysteryComparativeStats` — agrega por unidade (avg overall, avg por critério).

### Componentes
- `NovaMysteryVisitForm.tsx` — multi-step:
  1. Dados gerais (unit, data, hora, toggle anônimo, observação).
  2. Sliders 1-5 por critério (com label + comentário opcional).
  3. Upload de até 5 fotos (bucket `mystery-photos`).
  4. Resumo + submit.
- `MysteryVisitCard.tsx` — card resumo (data, unit, score geral, badges).
- `MysteryVisitDetail.tsx` — abre modal com scores detalhados + fotos.
- `MysteryComparativeChart.tsx` — Recharts: bar chart unit vs avg overall + radar por critério.

### Páginas
- `/cliente-misterioso` (`MysteryVisitPage.tsx`) — gerentes/supervisor/admin/master: botão "+ Nova visita" + lista de **minhas visitas**.
- `/cliente-misterioso/historico` (`MysteryHistoricoPage.tsx`) — lista geral com filtros (unit/período/visitor — visitor filter só aparece pra admin/supervisor).
- `/admin/cliente-misterioso` (`AdminMysteryPage.tsx`) — comparativo entre unidades, ranking, tendência por critério (12 semanas).

### Guards (App.tsx)
- `MysteryAccess` — visitor: `gerente_loja|gerente_adm|gerente|supervisor|admin|master`.
- `MysteryAdminAccess` — `admin|master|supervisor`.

### Sidebar
- Item "Cliente Misterioso" (ícone `UserSearch`) em **operacao** para visitor roles.
- Item "Cliente Misterioso (admin)" para admin/supervisor/master.

---

## 4. Push notifications

- Trigger AFTER UPDATE em `mystery_visits` (quando `overall_score` muda de NULL para valor):
  - Se `anonymous_to_team = false`: notifica gerentes da `target_unit_id` com título "Você foi visitado" + score.
  - Se `overall_score < 6`: notifica admin/master/supervisor + perfis com `lower(nome) LIKE '%roberto%'` ou `'%guga%'` (padrão já usado no projeto).

---

## 5. Arquivos tocados (previsão)

**Migration:** `supabase/migrations/<ts>_mystery_shopper.sql`

**Hooks novos:**
- `src/hooks/useMysteryCriteria.ts`
- `src/hooks/useMysteryVisits.ts`
- `src/hooks/useCreateMysteryVisit.ts`
- `src/hooks/useMysteryComparativeStats.ts`

**Componentes novos:**
- `src/components/mystery/NovaMysteryVisitForm.tsx`
- `src/components/mystery/MysteryVisitCard.tsx`
- `src/components/mystery/MysteryVisitDetail.tsx`
- `src/components/mystery/MysteryComparativeChart.tsx`
- `src/components/mystery/MysteryPhotoUploader.tsx`

**Páginas novas:**
- `src/pages/MysteryVisitPage.tsx`
- `src/pages/MysteryHistoricoPage.tsx`
- `src/pages/AdminMysteryPage.tsx`

**Editados:**
- `src/App.tsx` (3 rotas + 2 guards)
- `src/components/AppSidebar.tsx` (2 links + ícone `UserSearch`)
- `src/integrations/supabase/types.ts` (auto)

---

## 6. Decisões / detalhes
- **Anonimato blindado**: gerente da target_unit NUNCA tem permissão SELECT na row, mesmo com `anonymous_to_team=false`. Nesse caso ele só recebe push notification (sem expor quem). Isso evita qualquer brecha (mesmo via SQL direto).
- **Bucket privado** com path `{visit_id}/{filename}` — fotos servidas via signed URL.
- **overall_score** calculado server-side (avg dos scores * 2 → escala 0-10) — não confiamos em valor enviado pelo cliente.
- **Validação cliente**: zod — overall opcional (calculado), todos critérios obrigatórios (1-5), até 5 fotos × 5MB.
- **Único commit reversível**: 1 migration + arquivos novos + edits localizados.

Aprova pra executar?
