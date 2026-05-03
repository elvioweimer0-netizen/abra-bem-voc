# Stories 24h por Unidade (estilo Instagram)

Feature de stories efêmeros (24h) postados por líderes, visíveis aos colaboradores da unidade. Inclui visualizações, reações, cleanup automático e moderação.

---

## 1. Banco de Dados (migration única)

### Tabelas

**`stories`**
- `id` uuid pk
- `author_user_id` uuid → profiles(user_id) ON DELETE CASCADE
- `unit_id` uuid → units(id) ON DELETE CASCADE
- `setor` text nullable
- `media_url` text not null (path no bucket)
- `media_type` text check in ('image','video')
- `caption` text nullable, check length ≤ 200
- `duration_seconds` int default 0
- `created_at` timestamptz default now()
- `expires_at` timestamptz default (now() + interval '24h') not null
- Índices: `(unit_id, expires_at desc)`, `(author_user_id, created_at desc)`

**`story_views`**
- `id` uuid pk, `story_id`, `viewer_user_id`, `viewed_at`
- UNIQUE (story_id, viewer_user_id)

**`story_reactions`**
- `id` uuid pk, `story_id`, `user_id`, `emoji` check in ('👏','❤️','🎉','👍','🔥'), `created_at`
- UNIQUE (story_id, user_id, emoji)

### Trigger anti-spam
- BEFORE INSERT em `stories`: bloqueia se autor já tem ≥10 stories nas últimas 24h.

### RLS

**stories** (5 policies)
1. INSERT: `author_user_id = auth.uid()` AND user é líder (master/admin/supervisor/gerente_loja/gerente_adm/encarregado/fiscal/lider_setor) — via `has_role`.
2. SELECT (ativos por unidade): `expires_at > now() AND user_can_access_unit(auth.uid(), unit_id)`.
3. SELECT (próprio autor, inclusive expirados): `author_user_id = auth.uid()`.
4. UPDATE: autor + `created_at > now() - interval '5 min'` (só caption).
5. DELETE: autor OR admin/master.

**story_views** (2 policies)
- INSERT: `viewer_user_id = auth.uid()`.
- SELECT: `viewer_user_id = auth.uid()` OR autor do story.

**story_reactions** (3 policies)
- INSERT: `user_id = auth.uid()` AND tem acesso ao story.
- SELECT: tem acesso ao story.
- DELETE: `user_id = auth.uid()`.

---

## 2. Storage

Bucket **`stories`** (privado), max 50MB, mime: image/jpeg, image/png, image/webp, video/mp4.
Path: `{unit_id}/{author_user_id}/{story_id}.{ext}`.

Policies em `storage.objects`:
- INSERT: dono via `(storage.foldername(name))[2] = auth.uid()::text`.
- SELECT: autenticados (acesso real validado pela tabela `stories`).
- DELETE: dono OR admin/master.

---

## 3. Edge Function

**`cleanup-expired-stories`** (sem JWT, chamada por cron):
- Lista `stories` com `expires_at < now() - interval '7 days'`.
- Remove arquivos do bucket via `storage.remove`.
- DELETE rows. Retorna `{deleted_rows, deleted_files}`.

Cron via `pg_cron` (insert SQL com URL+anon key, não migration): diário 04:00 UTC.

---

## 4. Frontend

### Hook
`src/hooks/useStories.ts` — fetch stories ativos agrupados por unidade, marcar view, reagir, criar story (upload + insert), histórico próprio.

### Componentes
- `src/components/stories/StoriesBar.tsx` — círculos horizontais por unidade. Gradiente vermelho-laranja se há stories não vistos, cinza se todos vistos. Primeiro item = "+ Story" pra líderes.
- `src/components/stories/StoryViewer.tsx` — modal fullscreen, barra de progresso (5s foto / duration vídeo), tap esquerda/direita, swipe-down fecha, footer com autor/cargo/setor/tempo, 5 emojis de reação, contador de views pro autor. Auto-marca view ao abrir.
- `src/components/stories/StoryComposer.tsx` — FAB "+ Story", input com `capture="environment"` ou galeria, preview, caption ≤200, validação tipo/tamanho client-side, upload + insert.
- `src/components/stories/StoryViewersList.tsx` — drawer mostrando quem viu (só pro autor).

### Páginas
- `src/pages/MeusStories.tsx` (rota `/perfil/stories`) — histórico próprio até 7 dias.
- `src/pages/AdminStories.tsx` (rota `/admin/stories`) — moderação (admin/master): listar todos, deletar.

### Integração
- `src/pages/FeedColaborador.tsx`: `<StoriesBar />` no topo.
- `src/pages/Dashboard.tsx`: `<StoriesBar />` no topo.
- `src/components/AppSidebar.tsx`: item "Meus Stories" (todos), "Admin / Stories" (admin/master).
- `src/App.tsx`: rotas `/perfil/stories` e `/admin/stories`.

---

## 5. Push (silencioso)
Trigger AFTER INSERT em `stories` enfileira em `notification_events` (type `new_story`) para usuários da unidade, exceto autor. Reusa pipeline de notificações existente.

---

## 6. Arquivos tocados

**Migrations / Backend**
- `supabase/migrations/<ts>_stories.sql` (tabelas, índices, RLS, trigger anti-spam, trigger push, bucket + policies)
- `supabase/functions/cleanup-expired-stories/index.ts`
- Insert SQL separado (via tool `supabase--insert`) para `pg_cron`

**Frontend criados**
- `src/hooks/useStories.ts`
- `src/components/stories/StoriesBar.tsx`
- `src/components/stories/StoryViewer.tsx`
- `src/components/stories/StoryComposer.tsx`
- `src/components/stories/StoryViewersList.tsx`
- `src/pages/MeusStories.tsx`
- `src/pages/AdminStories.tsx`

**Frontend editados**
- `src/App.tsx`
- `src/components/AppSidebar.tsx`
- `src/pages/FeedColaborador.tsx`
- `src/pages/Dashboard.tsx`
- `src/integrations/supabase/types.ts` (auto)

---

Aprova pra eu executar?
