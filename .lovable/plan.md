# Plano — CHAT INTERNO (estilo WhatsApp)

Feature completa de mensageria interna com conversas individuais, grupos manuais, grupos automáticos por unidade/setor, canal global, realtime, read receipts, typing indicator, mídia, reações, reply/forward/pin, push e moderação.

---

## 1. SCHEMA SQL (migration única)

**Tabelas novas** em `public`:

- `chat_conversations` — `id`, `type` (`direct|group|channel|unit_auto|setor_auto`), `name`, `description`, `unit_id` → `units`, `setor`, `created_by` → `profiles.user_id`, `image_url`, `last_message_at`, `last_message_preview`, `created_at`. Index `(last_message_at desc)`.
- `chat_participants` — `conversation_id`, `user_id`, `joined_at`, `last_read_at`, `role` (`member|admin`), `muted`, `archived`. Unique `(conversation_id, user_id)`. Index `(user_id, conversation_id)`.
- `chat_messages` — `conversation_id`, `author_user_id`, `content`, `media_url`, `media_type` (`image|video|audio|document`), `media_duration_sec`, `reply_to_message_id`, `forwarded_from_message_id`, `pinned`, `created_at`, `edited_at`, `deleted_at`. Index `(conversation_id, created_at desc)`.
- `chat_message_reads` — `(message_id, user_id)` unique, `read_at`.
- `chat_message_reactions` — `(message_id, user_id, emoji)` unique. Emoji whitelist: 👍 ❤️ 😂 😮 😢 🙏 🔥 💪.
- `chat_message_reports` — `id`, `message_id`, `reporter_user_id`, `reason`, `created_at`, `resolved_at`, `resolved_by`. Para moderação.
- `chat_audit_log` — `id`, `action` (`delete|edit|pin|kick`), `actor_user_id`, `target_message_id`, `conversation_id`, `meta jsonb`, `created_at`.

**Funções `SECURITY DEFINER`** (evita recursão de RLS):
- `is_chat_participant(_uid, _conv) returns boolean`
- `is_chat_admin(_uid, _conv) returns boolean`
- `chat_unread_count(_uid) returns int`
- `chat_mark_read(_conv) returns void` — atualiza `last_read_at` e cria `chat_message_reads` para mensagens novas.

**Triggers**:
- `tg_chat_message_after_insert`: atualiza `last_message_at`/`last_message_preview` na conversation; insere `chat_message_reads` do próprio autor; insere `notification_events` para participantes não-mutados; detecta `@menção` por nome.
- `tg_chat_message_edit_window`: bloqueia `UPDATE` de `content` após 15 min.
- `tg_chat_message_soft_delete`: força `deleted_at` em vez de `DELETE` quando autor.
- `tg_chat_audit_delete`: registra em `chat_audit_log`.

**Realtime publication**: `ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages, chat_participants, chat_message_reactions, chat_message_reads;`

---

## 2. RLS

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| chat_conversations | participante (`is_chat_participant`) | `is_leadership` OR `type='direct'` | admin do grupo OR app admin/master | app admin/master |
| chat_participants | mesmo grupo | criador OR admin do grupo | próprio (mute/archive) OR admin | próprio OR admin |
| chat_messages | participante | participante AND `author_user_id=auth.uid()` | autor (≤15 min via trigger) | soft via trigger; admin/master hard |
| chat_message_reads | participante | `user_id=auth.uid()` | — | — |
| chat_message_reactions | participante | `user_id=auth.uid()` | — | `user_id=auth.uid()` |
| chat_message_reports | reporter OR admin/master | `reporter_user_id=auth.uid()` | admin/master | — |
| chat_audit_log | admin/master | trigger only | — | — |

---

## 3. STORAGE

Bucket privado **`chat-media`** (criado via SQL). Path: `{conversation_id}/{message_id}.{ext}`. Limite 50MB por arquivo (validação client + edge).
RLS storage.objects: SELECT/INSERT permitidos se `is_chat_participant(auth.uid(), (storage.foldername(name))[1]::uuid)`.

---

## 4. EDGE FUNCTIONS

- **`setup-auto-groups`** (one-shot, invocável por admin): para cada `units` cria `unit_auto` "Loja {nome}" e popula com profiles ativos da unidade; para cada `setor_tipo` cria `setor_auto` "{Setor} Curió"; cria canal global "Avisos Curió" `channel` com todos. Idempotente (checa por `name`+`type`). Auto-roda ao adicionar novo profile via trigger `tg_chat_autojoin_new_profile`.
- **`chat-media-presign`**: gera signed upload URL após validar participação.

---

## 5. FRONTEND

### Rotas e navegação
- Nova rota `/chat` e `/chat/:conversationId` em `src/App.tsx`.
- Item "Chat" no `AppSidebar` e `MobileBottomNav` com badge unread.
- Counter unread no `AppHeader` (botão ao lado do sino de notificação).
- Atalho `Cmd+J` global em `useCommandPalette` → navega `/chat`. Comando "chat com {nome}" no Command Palette.

### Componentes (`src/components/chat/`)
- `ChatLayout.tsx` — 2 colunas desktop, drill-down mobile.
- `ConversationList.tsx` + `ConversationListItem.tsx` — avatar, nome, preview, hora relativa, badge unread, pin/mute/archive icons.
- `ConversationView.tsx` — header (foto + nome + presença/typing), área de mensagens com infinite scroll reverso, footer com input.
- `MessageBubble.tsx` — bolha com reply-quote, forward badge, read receipts (✓/✓✓ azul), reactions row, hover menu (Reply, Forward, React, Copy, Pin, Delete, Report).
- `MessageInput.tsx` — textarea autosize, emoji picker (lib `emoji-picker-react`), anexar (image/video/doc), microfone hold-to-record (MediaRecorder API), enviar; emite `typing` debounced 500ms.
- `PresenceIndicator.tsx` — bolinha verde com base em Realtime presence.
- `TypingIndicator.tsx` — "{nome} está digitando…" debounced.
- `NewConversationModal.tsx` — tabs Pessoa/Grupo. Pessoa: search profiles → cria `direct` (ou abre existente). Grupo: nome + avatar + multi-select → cria `group` com criador como admin.
- `ConversationSettings.tsx` — info, participantes, mute/archive, leave, admin actions.
- `ForwardMessageModal.tsx`, `MediaLightbox.tsx`, `VoiceMessagePlayer.tsx`.

### Hooks (`src/hooks/`)
- `useConversations.ts` — lista + counters unread (RPC `chat_unread_count`).
- `useConversation(id)` — mensagens paginadas (50/página), realtime subscribe, optimistic send.
- `useChatPresence(conversationId)` — presence channel + typing broadcast.
- `useChatMediaUpload.ts` — presign + upload + lazy thumbnail.
- `useChatCache.ts` — IndexedDB (`idb-keyval`) últimas 200 msgs/conv.

### Push (reusa `notification_events`)
Trigger `tg_chat_message_after_insert` insere eventos:
- `chat_message` para participantes não-mutados (silencioso se app aberta na conv).
- `chat_mention` para @nomes.
- `chat_reaction` para autor da msg.
- `chat_added_to_group` em `INSERT` de `chat_participants` (não-direct).

`public/sw.js` já trata genericamente — só extender mapping de `type` → ícone/click action.

---

## 6. PERFORMANCE & UX

- Infinite scroll reverso 50/página com `keepPreviousData`.
- Optimistic UI: insere msg local com `status: 'sending'`, troca p/ `'sent'` quando RPC retorna; `'failed'` com retry.
- Debounce typing 500ms; presence heartbeat 30s; offline após 60s sem heartbeat.
- IndexedDB cache last 200 msgs/conv hidrata instantaneamente, depois reconcilia com server.
- Lazy load `<img loading="lazy">`, vídeos só carregam ao tocar play.

---

## 7. ARQUIVOS TOCADOS (previsto)

**Migrations**: 1 arquivo único com tabelas, RLS, funções, triggers, bucket, publication.

**Edge functions**: `supabase/functions/setup-auto-groups/index.ts`, `supabase/functions/chat-media-presign/index.ts`, `supabase/config.toml` (registrar com `verify_jwt=false` apenas no setup).

**Novos componentes**: `src/components/chat/{ChatLayout,ConversationList,ConversationListItem,ConversationView,MessageBubble,MessageInput,PresenceIndicator,TypingIndicator,NewConversationModal,ConversationSettings,ForwardMessageModal,MediaLightbox,VoiceMessagePlayer}.tsx`.

**Novos hooks**: `src/hooks/{useConversations,useConversation,useChatPresence,useChatMediaUpload,useChatCache}.ts`.

**Novas páginas**: `src/pages/Chat.tsx`.

**Edits**: `src/App.tsx` (rotas), `src/components/AppHeader.tsx` (badge unread + atalho), `src/components/AppSidebar.tsx` (item Chat), `src/components/MobileBottomNav.tsx` (item Chat), `src/hooks/useCommandPalette.tsx` (Cmd+J + comando "chat com"), `src/components/command-palette/CommandPalette.tsx` (entradas chat), `src/integrations/supabase/types.ts` (auto), `public/sw.js` (mapping types chat), `package.json` (`emoji-picker-react`, `idb-keyval`).

**Buckets criados**: `chat-media` (privado, 50MB).

---

## 8. RISCOS / NOTAS

- Volume realtime: subscription **só** da conversation aberta + 1 channel global "user-inbox" para counters; não subscrever todas conversations.
- `setup-auto-groups` deve rodar 1x manualmente após deploy; trigger cuida de novos profiles.
- Soft delete preserva histórico para auditoria; UI exibe "Mensagem apagada".
- Limite 15 min de edição enforced em trigger, não só UI.
- Não mexe em RLS de outras tabelas; `notification_events` só recebe `INSERT` adicional via trigger novo.

**Aprova pra executar?**