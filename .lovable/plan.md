# Plano: SUGESTÃO DE PRODUTO FALTANDO

Permite à equipe registrar produtos que clientes pediram mas a loja não tem; setor de compras prioriza pelo volume de votos + recência.

---

## 1. Schema SQL (migration única)

### Extensão
- `CREATE EXTENSION IF NOT EXISTS pg_trgm` (no schema `extensions` se possível, fallback `public`) para busca fuzzy de duplicatas.

### `missing_product_requests`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid pk | gen_random_uuid() |
| registered_by_user_id | uuid → profiles.id ON DELETE SET NULL | |
| unit_id | uuid → units.id NOT NULL | |
| product_name | text NOT NULL | |
| brand | text NULL | |
| category | text NULL | |
| customer_count | int NOT NULL DEFAULT 1 | número de upvotes (mantido por trigger) |
| priority_score | numeric NOT NULL DEFAULT 0 | recalculado por trigger: `customer_count + recency_boost` |
| notes | text NULL | |
| status | text CHECK in (`aberto`,`em_compras`,`adicionado`,`recusado`) DEFAULT `aberto` | |
| status_changed_by | uuid → profiles.id NULL | |
| status_changed_at | timestamptz NULL | |
| created_at | timestamptz DEFAULT now() | |
| updated_at | timestamptz DEFAULT now() | |

Índices: `(status, priority_score DESC)`, `(unit_id, created_at DESC)`, GIN trigram em `product_name` para fuzzy.

### `missing_product_upvotes`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid pk | |
| request_id | uuid → missing_product_requests ON DELETE CASCADE | |
| user_id | uuid → profiles.id ON DELETE CASCADE | |
| upvoted_at | timestamptz DEFAULT now() | |
| UNIQUE (request_id, user_id) | | |

### Função fuzzy
- `fn_search_missing_products(_query text, _limit int default 5)` retorna top matches por `similarity(product_name, _query) > 0.3` (SECURITY DEFINER, STABLE) — usada pelo modal antes de criar.

### Triggers
- `tg_missing_product_recount` (AFTER INSERT/DELETE em `missing_product_upvotes`): atualiza `customer_count` (count de upvotes + 1 do registrante) e `priority_score` = `customer_count * 10 + GREATEST(0, 30 - days_since_created)` (recência decai 30 dias).
- `tg_missing_product_status_notify` (AFTER UPDATE em `missing_product_requests`): se `status` mudou para `adicionado`, push pro `registered_by_user_id` + todos que upvotaram.
- `tg_missing_product_autoupvote` (AFTER INSERT em `missing_product_requests`): cria upvote do registrante (count inicial = 1).

### Cron
- Job semanal (segundas 9h) chamando edge function `missing-products-weekly` que envia push aos perfis de compras (admin/master/gerente_adm com gerencia FINANCEIRO/OPERACAO) com contagem de novos pedidos da semana. Insert via tool de insert (URL+anon key).

---

## 2. RLS

### missing_product_requests
- **INSERT**: `registered_by_user_id = coverage_profile_id_for(auth.uid())` (perfil do próprio user).
- **SELECT**: qualquer authenticated.
- **UPDATE**: 
  - status: somente admin/master/gerente_adm (campos limitados via WITH CHECK + trigger ignora outros campos).
  - `customer_count`/`priority_score`: somente sistema (atualizados via trigger).
- **DELETE**: admin/master.

### missing_product_upvotes
- **INSERT**: `user_id = coverage_profile_id_for(auth.uid())` (1 voto por user via UNIQUE constraint).
- **SELECT**: authenticated.
- **DELETE**: próprio user (desfazer voto) ou admin/master.

---

## 3. Frontend

### Hooks novos
- `useMissingProducts({ status?, sort? })` — lista ranqueada.
- `useCreateMissingProduct()` — INSERT.
- `useSearchMissingProducts(query)` — chama RPC fuzzy (debounced).
- `useUpvoteMissingProduct()` — toggle upvote.
- `useUpdateMissingProductStatus()` — para compras.
- `useMyMissingProductVotes()` — set de IDs upvotados.

### Componentes
- `MissingProductQuickModal.tsx` — form (nome, marca, categoria, notas). Conforme digita o nome (≥3 chars, debounce 300ms), chama search RPC. Se houver match >0.4: lista cards "Já existe — Reforçar este pedido?" com botão upvote inline. Se usuário ainda quer criar novo: confirma.
- `MissingProductCard.tsx` — card com nome, marca, categoria, badge de votos, badge de status, botão "Eu também" (toggle).
- `MissingProductsList.tsx` — lista virtualizada simples + filtro de status.
- `AdminStatusSelect.tsx` — Select para mudar status (admin only).

### Páginas
- `ProdutosFaltandoPage.tsx` (`/produtos-faltando`) — todos: lista + filtro status + criar.
- `AdminProdutosFaltandoPage.tsx` (`/admin/produtos-faltando`) — admin/master/gerente_adm: gerenciar status + estatísticas (total aberto, em compras, adicionado mês).

### Painel/Feed
- Botão `<MissingProductTriggerButton />` no `FeedColaborador.tsx` (abaixo do botão de reclamação).

### Edge function
- `supabase/functions/missing-products-weekly/index.ts` — conta requests da última semana, monta lista top 5, gera notification_events para admin/gerente_adm.

---

## 4. Rotas + Sidebar
- `App.tsx`: 
  - `/produtos-faltando` → todos autenticados
  - `/admin/produtos-faltando` → `<AdminOnly>` (estende para incluir gerente_adm)
- `AppSidebar.tsx`: link "Produtos faltando" (ícone `PackageSearch`) em `operacao` para todos; "Compras (faltando)" para admin/master/gerente_adm.

---

## 5. Arquivos tocados (previsão)

**Migration:** `supabase/migrations/<ts>_missing_products.sql`

**Hooks novos:**
- `src/hooks/useMissingProducts.ts`
- `src/hooks/useCreateMissingProduct.ts`
- `src/hooks/useSearchMissingProducts.ts`
- `src/hooks/useUpvoteMissingProduct.ts`

**Componentes novos:**
- `src/components/missing-products/MissingProductQuickModal.tsx`
- `src/components/missing-products/MissingProductTriggerButton.tsx`
- `src/components/missing-products/MissingProductCard.tsx`
- `src/components/missing-products/MissingProductsList.tsx`
- `src/components/missing-products/AdminStatusSelect.tsx`

**Páginas novas:**
- `src/pages/ProdutosFaltandoPage.tsx`
- `src/pages/AdminProdutosFaltandoPage.tsx`

**Edge function nova:** `supabase/functions/missing-products-weekly/index.ts`

**Cron:** insert via tool (cron job semanal chamando a edge function)

**Editados:**
- `src/App.tsx` (2 rotas)
- `src/components/AppSidebar.tsx` (2 links + ícone PackageSearch)
- `src/pages/FeedColaborador.tsx` (botão)
- `src/integrations/supabase/types.ts` (auto)
- `supabase/config.toml` (config edge function se necessário)
- `.lovable/plan.md`

---

## 6. Decisões / detalhes
- **Fuzzy threshold**: 0.4 sugere reforço; >0.7 mostra como "muito provável duplicata".
- **priority_score**: simples e previsível (`votes*10 + recency_boost`), recalculado em qualquer mudança de upvote.
- **Auto-upvote do registrante**: trigger garante `customer_count` começa em 1 sem precisar inserir manualmente.
- **Compras**: usuários `cargo IN (admin, master, gerente_adm)` recebem push semanal e veem `/admin/produtos-faltando`. Não restrinjo por gerência específica para evitar perfis órfãos.
- **Validação cliente**: zod — `product_name` 2-120 chars, `brand` ≤80, `category` ≤60, `notes` ≤500.
- **Único commit reversível**: 1 migration + arquivos novos + edits localizados + 1 insert (cron schedule).

Aprova pra executar?
