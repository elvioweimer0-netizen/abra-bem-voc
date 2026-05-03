# Plano: Modo Offline Básico

Adiciona suporte offline com cache de leitura, fila de escrita persistente e sincronização automática ao voltar online. Tudo em commit único reversível.

## 1. Service Worker (PWA leve, sem vite-plugin-pwa)

**Arquivo**: `public/sw.js` (substituir o kill-switch atual por SW funcional)

- Estratégia por tipo:
  - **Assets estáticos** (`/assets/`, fontes, imagens build): `CacheFirst`, cache `static-v1`.
  - **HTML/navegação**: `NetworkFirst` com fallback ao cache (timeout 3s) — evita shell travado.
  - **Supabase REST GET** (`/rest/v1/avisos?...`, `/rest/v1/profiles?id=eq.<self>`, `/rest/v1/checklist_*` do dia): `StaleWhileRevalidate`, cache `data-v1`, TTL 24h.
  - **Tudo mais**: passa direto (network only).
- Guard: SW só registra em produção e fora de iframe/preview Lovable (já temos esse padrão).
- Cleanup: `activate` deleta caches antigos.
- Não cachear: respostas com `Authorization` de outros users — usamos chave de cache que inclui `user_id` da query string quando aplicável; em dúvida, não cacheia.

**Registro**: `src/main.tsx` — guard contra iframe/preview, registra `/sw.js` apenas em produção.

## 2. IndexedDB — Fila de ações offline

**Lib**: `idb-keyval` (já instalada para o chat).

**Store**: `pending_actions` (array em chave única ou store dedicado via `idb`):
```ts
type PendingAction = {
  id: string;          // uuid local
  type: 'aviso_read' | 'checklist_response' | 'praise_create';
  payload: Record<string, any>;
  created_at: number;
  retries: number;
  last_error?: string;
};
```

Também store `cached_blobs` para fotos de checklist (Blob comprimido).

## 3. Hooks e contexto

**`src/hooks/useOnlineStatus.ts`**
- Estado: `'online' | 'offline' | 'sync'`.
- Listeners: `online`/`offline` events.
- Ping periódico (60s) a `supabase.from('profiles').select('id').limit(1)` com timeout 5s.
- Expõe: `status`, `isOnline`, `forceSync()`.

**`src/lib/offlineQueue.ts`**
- `enqueue(action)`, `getQueue()`, `removeAction(id)`, `processQueue()`.
- `processQueue()`: itera FIFO, executa por tipo via Supabase client, exponential backoff (1s, 2s, 4s, max 30s, 5 retries). Conflitos (409/duplicata) → descarta. Erros de rede → mantém na fila.

**`src/contexts/OfflineProvider.tsx`** (ou hook global)
- Dispara `processQueue` ao transitar `offline → online`.
- Atualiza status para `'sync'` durante processamento.

## 4. UI

**`src/components/OfflineBanner.tsx`**
- Renderiza no topo de `AppLayout` quando `status === 'offline'`.
- Texto: "Modo offline — suas ações serão salvas e sincronizadas."
- Cor: `bg-warning/destructive` (token existente).

**`src/components/OnlineStatusDot.tsx`**
- Bolinha no `AppHeader` ao lado do tema:
  - verde (`bg-emerald-500`): online
  - amarelo (`bg-amber-500`): sync
  - vermelho (`bg-destructive`): offline
- Tooltip mostra estado + nº de ações pendentes.

**`src/pages/SincronizacaoPerfil.tsx`** (rota `/perfil/sincronizacao`)
- Lista ações pendentes (tipo, criado em, retries, último erro).
- Botão "Sincronizar agora" → `forceSync()`.
- Botão "Limpar fila" (com confirmação) para casos travados.
- Link adicionado em `MeuPerfil.tsx`.

## 5. Operações offline suportadas

Wrappers nas chamadas existentes que detectam `!isOnline` e enfileiram:

- **Marcar aviso lido**: substitui call direto em `useAvisos`/handler equivalente. Idempotente (upsert por `(user_id, aviso_id)`).
- **Checklist response** (marcar item): payload `{ checklist_id, item_id, value, photo_blob_id? }`. Foto: `canvas.toBlob` com `image/jpeg` quality 0.7, salva em `cached_blobs`. Sync faz upload depois.
- **Praise create**: payload completo do elogio. Idempotente via uuid client-side (PK).

Outras operações (criar comunicação, editar perfil, chat, etc.) → toast "Disponível somente online" quando offline.

## 6. Cache de leitura (complementar ao SW)

- React Query já cacheia em memória; configurar `gcTime` maior (24h) e persistir cache de queries-chave (avisos recentes, checklists do dia, profile próprio) via `@tanstack/query-sync-storage-persister` apontando a IndexedDB.
- Filtro de persistência: só queries cuja chave começa com `['avisos-recent']`, `['checklists-today']`, `['profile-self']`.

## 7. Regras éticas/segurança

- SW NUNCA cacheia respostas com `select=*` de tabelas sensíveis (HR, churn, RH). Lista allowlist explícita de paths cacheáveis.
- Cache local limpo no logout (`signOut` → `caches.delete()` + `clear()` IndexedDB stores `cached_blobs` e `pending_actions` quando vazia).
- Disclaimer no banner: dados podem estar desatualizados.

## 8. Arquivos tocados

Criados:
- `src/hooks/useOnlineStatus.ts`
- `src/lib/offlineQueue.ts`
- `src/contexts/OfflineProvider.tsx`
- `src/components/OfflineBanner.tsx`
- `src/components/OnlineStatusDot.tsx`
- `src/pages/SincronizacaoPerfil.tsx`

Editados:
- `public/sw.js` (substituir kill-switch por SW funcional com allowlist)
- `src/main.tsx` (registro SW guardado)
- `src/App.tsx` (OfflineProvider + rota `/perfil/sincronizacao`)
- `src/components/AppLayout.tsx` (OfflineBanner)
- `src/components/AppHeader.tsx` (OnlineStatusDot)
- `src/pages/MeuPerfil.tsx` (link sincronização)
- Hooks/handlers existentes de avisos, checklists e praise (wrap com queue).
- `index.html` (manter script anti-flash; sem mudanças de manifest).

## 9. Não escopo

- Sem push notifications offline.
- Sem edição de mensagens de chat offline.
- Sem sync bidirecional de dados de leitura — apenas fila de escrita + cache SWR.

Aprova pra executar?
