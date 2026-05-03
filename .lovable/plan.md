# Caderno do Gerente / Playbook — Plano de Execução

Feature de base de conhecimento prática para líderes: artigos curtos com categoria, script, "o que NÃO fazer", exemplo real e vídeo. Inclui visualizações, feedback útil/não útil, versionamento e widget de sugestão.

---

## 1) Banco de dados (migration única)

### Tabelas

**`playbook_categories`**
- `code` (slug único), `name`, `icon`, `description`, `ordem`, `active`
- SEED imediato das 6 categorias: `como_conduzir`, `como_abordar`, `como_cobrar`, `como_ensinar`, `como_reconhecer`, `como_resolver`

**`playbook_articles`**
- `category_id` FK restrict, `title` (5–150), `context` (markdown), `script`, `what_not_to_do`, `real_example`, `video_url`, `tags text[]`, `visible_to text[]` default com 8 cargos, `created_by`, `version int default 1`, `active`, `featured_until timestamptz` (para o "Destaque por 1 semana")
- Trigger `BEFORE UPDATE`: incrementa `version` e atualiza `updated_at` quando `context/script/what_not_to_do/real_example/video_url/title` mudam
- Índice GIN em `tags` e `visible_to`

**`playbook_article_views`**
- `article_id`, `user_id`, `viewed_at`
- Índice `(article_id, user_id)` e `(user_id, viewed_at desc)` para o widget de sugestão

**`playbook_article_feedback`**
- `article_id`, `user_id`, `useful boolean`, `comment`, `created_at`, `updated_at`
- Unique `(article_id, user_id)` → upsert pelo cliente

### Função helper
- `is_rh_or_admin(uid)`: retorna true se master/admin OU (`gerente_adm` AND setor = 'RH')

### RLS

| Tabela | SELECT | INSERT/UPDATE | DELETE |
|---|---|---|---|
| categories | autenticados | `is_rh_or_admin` | `is_rh_or_admin` |
| articles | `active=true AND cargo ∈ visible_to` OU master/admin | `is_rh_or_admin` | bloqueado (soft via active) |
| views | próprio OU admin/RH | `user_id=auth.uid()` | — |
| feedback | próprio OU admin/RH | `user_id=auth.uid()` | próprio |

---

## 2) Frontend

### Hooks (`src/hooks/usePlaybook.ts`)
- `usePlaybookCategories()` — lista com contagem de artigos visíveis
- `usePlaybookArticles({ categoryId, search })` — filtro + flag `viewed`
- `usePlaybookArticle(id)` — detalhe + auto-mark view + feedback do usuário
- `useSubmitFeedback()` — upsert
- `usePlaybookSuggestion()` — sugere 1 artigo baseado em última categoria visitada / categoria menos vista

### Páginas
- **`/caderno`** (`src/pages/Caderno.tsx`) — layout 2 colunas desktop / 1 mobile, busca topo, sidebar categorias com contadores, grid de cards (título, categoria, snippet, badge "Visto")
- **`/caderno/:articleId`** (`src/pages/CadernoArtigo.tsx`) — sections renderizadas em markdown, vídeo embed, footer feedback 👍/👎 + comentário, botão "Editar" para RH/admin
- **`/admin/caderno`** (`src/pages/AdminCaderno.tsx`) — tabs: Artigos / Categorias / Estatísticas. CRUD com modal/form, editor markdown (textarea + preview), toggle Destaque (seta `featured_until = now()+7d`), métricas (mais vistos, mais úteis, sem feedback)

### Componentes (`src/components/playbook/`)
- `PlaybookCategoryList.tsx`
- `PlaybookArticleCard.tsx`
- `PlaybookArticleSection.tsx` (renderiza markdown via `react-markdown` já presente)
- `PlaybookFeedbackBar.tsx`
- `PlaybookArticleFormModal.tsx` (admin)
- `PlaybookCategoryFormModal.tsx` (admin)
- `PlaybookSuggestionWidget.tsx` (Dashboard)

### Navegação (`src/components/AppSidebar.tsx`)
- Adicionar item "Caderno" para todos os líderes (não-colaborador)
- Sub-item "Admin / Caderno" só para `is_rh_or_admin`

### Integrações leves
- Adicionar `<PlaybookSuggestionWidget />` no `Dashboard.tsx`
- Rotas em `src/App.tsx`

---

## 3) Regras

- Commit único reversível (1 migration + arquivos novos)
- Não tocar em RLS de outras tabelas
- Soft delete via `active=false`
- Versionamento via trigger
- Conteúdo dos artigos vem depois — apenas seed das 6 categorias

---

## 4) Arquivos previstos

**Criar:**
- `supabase/migrations/<timestamp>_playbook.sql`
- `src/hooks/usePlaybook.ts`
- `src/pages/Caderno.tsx`
- `src/pages/CadernoArtigo.tsx`
- `src/pages/AdminCaderno.tsx`
- `src/components/playbook/PlaybookCategoryList.tsx`
- `src/components/playbook/PlaybookArticleCard.tsx`
- `src/components/playbook/PlaybookArticleSection.tsx`
- `src/components/playbook/PlaybookFeedbackBar.tsx`
- `src/components/playbook/PlaybookArticleFormModal.tsx`
- `src/components/playbook/PlaybookCategoryFormModal.tsx`
- `src/components/playbook/PlaybookSuggestionWidget.tsx`

**Editar:**
- `src/App.tsx` (3 rotas)
- `src/components/AppSidebar.tsx` (item + sub-item)
- `src/pages/Dashboard.tsx` (widget sugestão)
- `.lovable/plan.md`

Aprova pra eu executar?
