# Reações + Comentários nos Avisos — Plano

Adiciona engajamento aos avisos: 5 emojis de reação (toggle) e thread de comentários com 1 nível de reply, edição em 15min e soft-delete por moderador.

## 1. Schema (migration única)

### `aviso_reactions`
- `id uuid pk default gen_random_uuid()`
- `aviso_id uuid not null` → `avisos(id) on delete cascade`
- `user_id uuid not null` (= profiles.user_id; sem FK pra auth.users)
- `emoji text not null check (emoji in ('👍','❤️','😊','⚠️','🙏'))`
- `created_at timestamptz not null default now()`
- `unique (aviso_id, user_id, emoji)`
- index `(aviso_id)`

### `aviso_comments`
- `id uuid pk default gen_random_uuid()`
- `aviso_id uuid not null` → `avisos(id) on delete cascade`
- `user_id uuid not null`
- `parent_comment_id uuid nullable` → `aviso_comments(id) on delete cascade`
- `body text not null check (length(body) between 1 and 1000)`
- `created_at timestamptz not null default now()`
- `edited_at timestamptz nullable`
- `deleted_at timestamptz nullable`
- index `(aviso_id, created_at desc)`

> Nota: `avisos` não tem `unit_id` — só `unidade` (enum). Reuso o mesmo critério da policy `View avisos` da tabela atual: visível se `unidade IS NULL` ou admin/master ou `unidade = get_user_unidade(auth.uid())`. Helper consolidado:

```sql
create or replace function can_view_aviso(_user uuid, _aviso uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from avisos a
    where a.id = _aviso
      and (a.unidade is null
           or has_role(_user,'admin')
           or has_role(_user,'master')
           or a.unidade = get_user_unidade(_user))
  )
$$;
```

## 2. RLS

**aviso_reactions** (RLS on):
- SELECT: `can_view_aviso(auth.uid(), aviso_id)`
- INSERT: `user_id = auth.uid() AND can_view_aviso(auth.uid(), aviso_id)`
- DELETE: `user_id = auth.uid()`
- (sem UPDATE)

**aviso_comments** (RLS on):
- SELECT: `can_view_aviso(auth.uid(), aviso_id)`
- INSERT: `user_id = auth.uid() AND can_view_aviso(auth.uid(), aviso_id)`
- UPDATE: `user_id = auth.uid() AND created_at > now() - interval '15 minutes'` (with check idem; front seta `edited_at=now()` ao editar `body`)
- DELETE: `user_id = auth.uid() OR has_role(auth.uid(),'master') OR has_role(auth.uid(),'admin')` — porém front faz **soft delete** (UPDATE `deleted_at`), DELETE policy só pra cleanup. Pra soft-delete por moderador, adiciono extra UPDATE policy: moderador pode setar `deleted_at` mesmo passados 15min:
  - UPDATE policy `Moderators soft delete`: `has_role(auth.uid(),'admin') OR has_role(auth.uid(),'master')`

**Não toco em RLS de `avisos`.**

## 3. Notificações (triggers)

Trigger `after insert on aviso_comments`:
- Se `parent_comment_id` é null → enfileira `notification_events` pro `criado_por` do aviso (se ≠ author do comment).
- Se reply → enfileira pro `user_id` do comentário pai (se ≠ author).
- Tipo: `aviso_comment` / `aviso_comment_reply`, payload com `aviso_id`, `comment_id`.

## 4. Frontend

### Hook `src/hooks/useAvisoEngagement.ts`
- `useAvisoReactions(avisoId)` → list + counts agregados por emoji + minhasReações; mutations toggle.
- `useAvisoComments(avisoId)` → árvore (parent → children), join com `profiles` (nome, avatar, cargo).
- `useAvisoEngagementCounts(avisoIds[])` → batch retorna `{ aviso_id, reactions_count, comments_count }` pra cards.

### Componentes (`src/components/avisos/`)
- `AvisoReactionBar.tsx` — 5 botões emoji + contador, highlight se user reagiu, tooltip "Você reagiu com X".
- `AvisoComentarios.tsx` — lista, replies indentadas (margin-left), form rodapé, ações Responder/Editar/Excluir condicionais. Comentário com `deleted_at` mostra italic muted "Comentário removido por moderador".
- `AvisoCommentItem.tsx` — extraído pra reuso recursivo (1 nível só).
- `AvisoEngagementSummary.tsx` — pequeno: "👍 12 · 💬 4" pra cards.

### Páginas
- **Nova** `src/pages/AvisoDetalhe.tsx` em `/avisos/:id`: header (titulo/conteudo/badge urgente), `AvisoReadButton`, `AvisoReadStats`, `AvisoReactionBar`, `AvisoComentarios`. Rota adicionada em `App.tsx`.
- **Editar** `src/pages/Avisos.tsx`: cards/linhas viram clicáveis pra `/avisos/:id`; mostrar `AvisoEngagementSummary`.
- **Editar** `src/components/AvisosBanner.tsx`: incluir `AvisoReactionBar` inline + link "Ver comentários (N)" pra detalhe.
- **Editar** `src/pages/FeedColaborador.tsx` (se renderiza avisos): incluir `AvisoEngagementSummary` + click pra detalhe.

## 5. Regras

- Migration única: 2 tabelas + helper `can_view_aviso` + RLS + trigger de notificação.
- Sem mexer em RLS de outras tabelas.
- AvisoReadButton e AvisoReadStats permanecem intactos.
- Soft-delete: front sempre faz `update set deleted_at=now()`, nunca `delete` real.

## 6. Arquivos tocados

**Novos:**
- `supabase/migrations/<ts>_aviso_engagement.sql`
- `src/hooks/useAvisoEngagement.ts`
- `src/components/avisos/AvisoReactionBar.tsx`
- `src/components/avisos/AvisoComentarios.tsx`
- `src/components/avisos/AvisoCommentItem.tsx`
- `src/components/avisos/AvisoEngagementSummary.tsx`
- `src/pages/AvisoDetalhe.tsx`

**Editados:**
- `src/App.tsx` (rota `/avisos/:id`)
- `src/pages/Avisos.tsx` (cards clicáveis + summary)
- `src/components/AvisosBanner.tsx` (reaction bar inline + link)
- `src/pages/FeedColaborador.tsx` (summary + click) — se aplicável
- `src/integrations/supabase/types.ts` (auto)
- `.lovable/plan.md`

Aprova pra eu executar?
