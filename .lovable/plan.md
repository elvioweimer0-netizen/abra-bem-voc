# Pílulas de Cultura Curió — Plano de Implementação

Feature pra reforçar diariamente os valores da Curió com micro-conteúdos ("pílulas") visíveis no Feed e no Painel, com curtidas, navegação por valor e CRUD administrativo.

## 1. Banco de Dados (migration única)

### Tabela `culture_values`
- `id uuid pk default gen_random_uuid()`
- `code text unique not null` (ex: `acolhimento`, `qualidade`, `compromisso`, `familia_curio`)
- `name text not null`
- `description text default ''`
- `color text not null default '#6366f1'` (HSL/hex pra badge)
- `icon text not null default 'sparkles'` (nome lucide-react)
- `ordem smallint not null default 0`
- `active boolean not null default true`
- `created_at`, `updated_at`

**Seed (no mesmo migration):**
| code | name | descrição curta |
|---|---|---|
| acolhimento | Acolhimento | Recebemos cada pessoa com calor humano |
| qualidade | Qualidade | Excelência em tudo que entregamos |
| compromisso | Compromisso | Palavra dada, palavra cumprida |
| familia_curio | Família Curió | Somos um time, somos família |

### Tabela `culture_pills`
- `id uuid pk`
- `title text not null` (≤ 80 chars)
- `content text not null check (char_length(content) <= 280)`
- `value_id uuid fk culture_values(id) on delete restrict`
- `image_url text nullable`
- `link_url text nullable`
- `display_date date not null unique` (1 pílula por dia)
- `active boolean default true`
- `created_by uuid fk profiles(user_id) on delete set null`
- `created_at`, `updated_at`
- Índice em `display_date desc`, `value_id`

### Tabela `culture_pill_likes`
- `id uuid pk`
- `pill_id uuid fk culture_pills(id) on delete cascade`
- `user_id uuid not null` (= auth.uid())
- `liked_at timestamptz default now()`
- `unique (pill_id, user_id)`
- Índice em `pill_id`

### Helper function
- `is_culture_editor(_user_id uuid)` retorna true se: `master`, `admin`, ou `gerente_adm` cujo `cargo_titulo|descricao|nome` contém "rh"/"recursos humanos"/"marketing". Stable, security definer, search_path=public.

## 2. RLS

**culture_values & culture_pills:**
- SELECT: `authenticated` → `true` (todos veem)
- INSERT/UPDATE: `is_culture_editor(auth.uid())`
- DELETE: bloqueado (preserva histórico). Para "remover" usa `active=false`.

**culture_pill_likes:**
- SELECT: `authenticated` → `true` (contador público)
- INSERT: `user_id = auth.uid()`
- DELETE: `user_id = auth.uid()`
- UPDATE: bloqueado

## 3. Frontend

### Hook `useCulturePills.ts`
- `useTodayPill()` → pílula com `display_date = hoje` + value join + count likes + my_liked
- `useCulturePillsList(valueCode?, page)` → paginação 12/página
- `useCultureValues()` → lista valores ativos
- `useToggleLike(pillId)` → mutation insert/delete + invalidate
- `useScheduledPills(monthStart)` → para calendário admin
- `useCulturePillCRUD()` → upsert/toggle active
- `useCanEditCulture()` → checa se user é editor (mesma regra do helper, baseada em roles + cargo)

### Componentes (`src/components/culture/`)
- `CulturePillCard.tsx` — card destaque com cor do valor, ícone, título, conteúdo, botão curtir (Heart lucide), contador, opcional imagem/link. Variante `compact` pra topo de Feed/Painel.
- `CultureValueBadge.tsx` — pill colorido com ícone + nome.
- `CulturePillFormModal.tsx` — admin: título, conteúdo (counter 280), valor select, imagem upload (bucket existente `galeria` ou novo `culture` — usarei `galeria` pra evitar bucket novo), link, data (date picker valida unique).
- `CultureCalendar.tsx` — grid mensal com pílulas marcadas por cor do valor; click abre form de edição/criação naquela data.

### Páginas
- `/cultura` (`Cultura.tsx`) — header com chips de valores (filtro), grid de pílulas paginado, link "ver todas do valor X".
- `/cultura/valor/:code` (`CulturaValor.tsx`) — header do valor (cor, ícone, descrição), lista de pílulas só desse valor.
- `/admin/cultura` (`AdminCultura.tsx`) — gate `useCanEditCulture`. Tabs: Calendário | Lista | Valores. Botão "Importar pacote inicial" gera 7 pílulas de exemplo distribuídas pelos 4 valores nos próximos 7 dias úteis (só inserir se o dia estiver vazio).

### Integrações
- `FeedColaborador` (Comunicação): inserir `<CulturePillCard variant="compact">` no topo, antes da lista.
- `Dashboard` (Painel): inserir mesmo card numa nova seção "Pílula do dia" acima dos widgets existentes.

## 4. Navegação

`AppSidebar.tsx`:
- Item raiz **Cultura** (ícone `Sparkles`) → `/cultura` — visível pra todos autenticados.
- Sub-item **Admin Cultura** → `/admin/cultura` — visível só se `useCanEditCulture()` true.

`App.tsx`: rotas `/cultura`, `/cultura/valor/:code`, `/admin/cultura` dentro de `<AppLayout>` protegidas.

## 5. Regras

- Tudo numa migration reversível (CREATE TABLE + policies + helper + INSERT seed).
- Não mexer em RLS de outras tabelas.
- Sem novo bucket: imagens reutilizam `galeria`.
- Sem cron / sem edge function (não pediu notificação).
- Anonimato dos likes: contador público é OK (não viola anonimato — é like opt-in).

## 6. Arquivos a serem tocados

**Novos:**
- `supabase/migrations/<timestamp>_culture_pills.sql`
- `src/hooks/useCulturePills.ts`
- `src/components/culture/CulturePillCard.tsx`
- `src/components/culture/CultureValueBadge.tsx`
- `src/components/culture/CulturePillFormModal.tsx`
- `src/components/culture/CultureCalendar.tsx`
- `src/pages/Cultura.tsx`
- `src/pages/CulturaValor.tsx`
- `src/pages/AdminCultura.tsx`

**Editados:**
- `src/App.tsx` (3 rotas)
- `src/components/AppSidebar.tsx` (item Cultura + sub Admin)
- `src/pages/Dashboard.tsx` (card pílula do dia no topo)
- `src/components/comunicacao/FeedColaborador.tsx` (ou equivalente — vou localizar)
- `src/integrations/supabase/types.ts` (auto)
- `.lovable/plan.md`

Aprova pra eu executar?
