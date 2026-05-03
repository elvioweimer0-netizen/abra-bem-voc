# Plano — HISTÓRIAS DO CURIÓ

Feature de storytelling cultural: colaboradores submetem histórias reais ligadas aos valores da empresa, RH modera, feed público destaca aprovadas, com curtidas, hall do mês e widget no Feed.

## 1. Schema (migration única)

**Tabela `curio_stories`**
- `id uuid PK default gen_random_uuid()`
- `author_user_id uuid` → `profiles(user_id) ON DELETE CASCADE`
- `value_id uuid NULL` → `culture_values(id) ON DELETE SET NULL` (graceful: tabela já existe)
- `title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 100)`
- `content text NOT NULL CHECK (char_length(content) BETWEEN 30 AND 1500)`
- `image_url text NULL`
- `status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','rejeitada','arquivada'))`
- `moderated_by uuid NULL` → `profiles(user_id)`
- `moderated_at timestamptz NULL`
- `moderation_note text NULL`
- `published_at timestamptz NULL`
- `created_at`, `updated_at` (trigger `tg_set_updated_at`)
- Índice: `(status, published_at DESC)` e `(author_user_id)`

**Tabela `curio_story_likes`**
- `id uuid PK`, `story_id`, `user_id`, `liked_at`
- Unique `(story_id, user_id)`

## 2. RLS

**curio_stories** (4 policies):
- INSERT: `author_user_id = auth.uid()` (status forçado 'pendente' via trigger BEFORE INSERT)
- SELECT: `status='aprovada'` OU `author_user_id=auth.uid()` OU `is_rh_or_admin(auth.uid())`
- UPDATE: autor pode editar conteúdo se `status='pendente'`; moderador (`is_rh_or_admin`) pode mudar `status`/`moderation_note`/`moderated_*`/`published_at`
- DELETE: nenhuma policy (bloqueado — usar status='arquivada')

**curio_story_likes** (3 policies):
- INSERT: `user_id = auth.uid()` AND story está `aprovada`
- SELECT: autenticado (agregado)
- DELETE: `user_id = auth.uid()`

## 3. Triggers/Functions

- `tg_curio_story_force_pending` BEFORE INSERT: força `status='pendente'`, `moderated_*`/`published_at` NULL
- `tg_curio_story_on_status_change` AFTER UPDATE: ao virar `aprovada` → push pro autor + set `published_at`; ao virar `rejeitada` → push com `moderation_note`
- `tg_curio_story_notify_moderators` AFTER INSERT: enfileira notification_events pra cada moderador RH
- Reaproveita `update_updated_at_column`

## 4. Storage

Bucket `curio-stories` privado, 5MB max:
- Upload: autor (`auth.uid()::text = (storage.foldername(name))[1]`)
- Leitura: qualquer autenticado
- Update/Delete: só autor

## 5. Frontend

**Hook `useCurioStories.ts`**: listagem (filtro status/value/search/paginação), criação, like/unlike (toggle), moderação, widget semana, hall do mês.

**Páginas**:
- `/historias` — feed paginado aprovadas, chips por valor, busca, FAB "+ Contar uma história"
- `/historias/hall-do-mes` — top 5 curtidas no mês corrente
- `/admin/historias` — tabs Pendentes/Aprovadas/Rejeitadas/Arquivadas, ações Aprovar/Rejeitar/Arquivar com `moderation_note`

**Componentes** (`src/components/historias/`):
- `HistoriaCard.tsx` — título, autor (nome+avatar), badge valor, content, foto, contador curtidas, botão curtir
- `NovaHistoriaModal.tsx` — form com zod (title 5-100, content 30-1500, valor select, upload imagem opcional)
- `ModeracaoHistoriaItem.tsx` — visualização inline + ações
- `HistoriaSemanaWidget.tsx` — embutido no FeedColaborador
- `HistoriaFiltrosChips.tsx`

**Validação client-side**: zod schemas espelham check constraints.

## 6. Push notifications

Via `notification_events` (já existe):
- `story_submitted` → moderadores RH
- `story_approved` → autor ("Sua história foi publicada!")
- `story_rejected` → autor com `moderation_note`

## 7. Navegação (`AppSidebar.tsx`)

- "Histórias" — todos os perfis (seção Cultura, abaixo de Pílulas de Cultura)
- "Admin / Histórias" — `master`, `admin`, `gerente_adm` (com `is_rh_or_admin` no guard de rota)

`App.tsx`: adicionar rotas `/historias`, `/historias/hall-do-mes`, `/admin/historias` (esta última com guard).

## 8. Integração FeedColaborador

Inserir `<HistoriaSemanaWidget />` em seção própria (após avisos urgentes, antes de pílulas).

## Arquivos tocados (previsão)

**Criados**:
- `supabase/migrations/<ts>_curio_stories.sql`
- `src/hooks/useCurioStories.ts`
- `src/pages/Historias.tsx`
- `src/pages/HistoriasHallDoMes.tsx`
- `src/pages/AdminHistorias.tsx`
- `src/components/historias/HistoriaCard.tsx`
- `src/components/historias/NovaHistoriaModal.tsx`
- `src/components/historias/ModeracaoHistoriaItem.tsx`
- `src/components/historias/HistoriaSemanaWidget.tsx`
- `src/components/historias/HistoriaFiltrosChips.tsx`

**Editados**:
- `src/App.tsx` (rotas + guard)
- `src/components/AppSidebar.tsx` (itens menu)
- `src/pages/FeedColaborador.tsx` (widget)
- `src/integrations/supabase/types.ts` (auto)
- `.lovable/plan.md`

## Regras respeitadas
- Migration única reversível
- Sem alterar RLS de outras tabelas
- Validação client + server (check constraints + trigger)
- Graceful: `culture_values` referenciada como nullable
- DELETE bloqueado (status='arquivada')

Aprova pra eu executar?
