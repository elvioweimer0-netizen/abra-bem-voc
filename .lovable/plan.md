# Plano — Smart Notifications Agrupadas

## Objetivo
Substituir a lista flat de notificações no sino do header por grupos inteligentes (mesmo `type` + alvo + janela 4h), com controle de frequência por usuário e push silencioso para eventos individuais (push barulhento só em resumos).

## 1) SQL (migration única)

**Alterar `notification_events`:**
- `ALTER TABLE add column grouping_key text` (nullable, sem default).
- `CREATE INDEX idx_ne_user_group ON notification_events(recipient_user_id, grouping_key, created_at DESC)`.

**Backfill de `grouping_key`** com regra padrão:
```
coalesce(payload->>'aviso_id', payload->>'occurrence_id', payload->>'goal_id',
         payload->>'story_id', payload->>'meeting_id', payload->>'journey_id', '') 
|| ':' || type::text
```

**Trigger `tg_notification_events_grouping_key` (BEFORE INSERT)** preenche `grouping_key` automaticamente quando NULL, usando a mesma regra. Idempotente.

**Estender `notification_preferences`:**
- `group_notifications boolean default true`
- `digest_frequency text default 'realtime'` (`realtime` | `hourly` | `every_4h` | `daily`)
- check: valor deve estar no enum acima.

**View `notification_groups` (security_invoker = true):**
Agrega eventos do usuário em janela móvel de 4h por `grouping_key`:
```sql
SELECT recipient_user_id AS user_id,
       grouping_key,
       (array_agg(type ORDER BY created_at DESC))[1] AS type,
       (array_agg(title ORDER BY created_at DESC))[1] AS sample_title,
       (array_agg(body  ORDER BY created_at DESC))[1] AS sample_body,
       (array_agg(payload ORDER BY created_at DESC))[1] AS sample_payload,
       (array_agg(unit_id ORDER BY created_at DESC))[1] AS unit_id,
       count(*)::int AS event_count,
       max(created_at) AS latest_at,
       min(created_at) AS earliest_at,
       count(*) FILTER (WHERE sent_at IS NULL)::int AS unread_count
FROM public.notification_events
WHERE recipient_user_id IS NOT NULL
  AND created_at >= now() - interval '4 hours'
  AND grouping_key IS NOT NULL
GROUP BY recipient_user_id, grouping_key;
```
RLS já aplicada via `security_invoker` (herda policies de `notification_events`).

## 2) Frontend

### 2.1 `src/components/notifications/NotificationCenter.tsx` (novo)
Substitui o `DropdownMenuContent` atual no `AppHeader.tsx` (linhas 147–164). Popover (~360px) com:
- Header "Notificações" + link "Configurar" (→ `/meu-perfil`).
- Toggle inline: `Agrupadas` ↔ `Todas` (respeitando preferência).
- Lista de grupos: ícone por `type`, badge `count`, texto agregado:
  - `count==1` → título original
  - `count>1` → "N atualizações: <sample_title>"
- Click no grupo expande (Accordion) listando eventos individuais (últimos 10).
- Badge no sino = `sum(unread_count)` quando agrupado, ou `count(events unread)` quando flat.

### 2.2 Hook `src/hooks/useNotificationGroups.ts` (novo)
- Query da view `notification_groups` filtrada por `user_id = auth.uid()` ordenada por `latest_at desc`.
- Hook complementar `useNotificationEvents(grouping_key)` para expandir.
- Realtime: subscribe em `postgres_changes` da tabela `notification_events` com filter `recipient_user_id=eq.<uid>` → invalida cache.
- Graceful: se query falhar (view ausente), cai pra leitura direta de `notification_events` agrupada client-side.

### 2.3 `src/components/NotificationSettings.tsx` (editar)
Adicionar:
- Switch "Agrupar notificações similares" → `group_notifications`.
- Select "Frequência de notificações push": `Tempo real`, `A cada hora`, `A cada 4h`, `Resumo diário` → `digest_frequency`.
Persistido no upsert existente.

### 2.4 `src/components/AppHeader.tsx` (editar)
Trocar bloco do `DropdownMenu` do sino por `<NotificationCenter />`. Badge passa a refletir `unread_count` real.

## 3) Push (silencioso vs barulhento)

`src/components/PushPermission.tsx` (editar): nada muda no fluxo de subscription.

Consumo do `digest_frequency` é **client-side** por enquanto: o Service Worker (`public/sw.js`) já existe; adicionar handler que lê do payload um campo `silent: true|false` ao receber push. Eventos individuais → `silent: true` (apenas badge), resumos → `silent: false`.

Como não há infra de envio de push real ainda (sem VAPID), apenas:
- Documentar contrato no SW (handler `push` lendo `silent`).
- Adicionar TODO no NotificationCenter pra integração futura com edge function de digest.

Sem nova edge function nesta entrega — escopo do request fala em "Web Push silencioso" como comportamento, e a infra de envio será habilitada quando VAPID for provisionado. (Mantém commit reversível e pequeno.)

## 4) Graceful Degradation

- Se `notification_events` não tiver `grouping_key` (migration falhou): hook detecta erro de coluna e agrupa client-side por `type + payload.<id>`.
- Se view `notification_groups` ausente: idem fallback.
- Se `notification_preferences` não tem colunas novas: hook usa defaults `{group: true, freq: 'realtime'}`.

## 5) Arquivos tocados

**Criados:**
- `supabase/migrations/<ts>_smart_notifications_grouping.sql`
- `src/components/notifications/NotificationCenter.tsx`
- `src/components/notifications/NotificationGroupItem.tsx`
- `src/hooks/useNotificationGroups.ts`

**Editados:**
- `src/components/AppHeader.tsx` (substitui dropdown do sino)
- `src/components/NotificationSettings.tsx` (toggle + select)
- `public/sw.js` (handler `push` respeitando `silent`)
- `src/integrations/supabase/types.ts` (auto)
- `.lovable/plan.md`

## Não escopo (explicitado)
- Edge function de digest agendada (sem VAPID provisionado ainda).
- Mudança em RLS de outras tabelas.
- Reescrita dos triggers que inserem em `notification_events` (continuam inserindo `grouping_key=NULL` e o BEFORE INSERT preenche).

Aprova?