# TV de Refeitório — Plano

Página display fullscreen 16:9 que roda nas TVs das copas/refeitórios das lojas, sem login, acessada por token único da unidade. Admin gerencia tudo num CRUD com QR code.

## 1) Schema (1 migration)

**`tv_displays`**
- `id uuid pk`, `unit_id uuid fk units NOT NULL`
- `slug text UNIQUE NOT NULL` (ex: `cidade-alta-tv1`)
- `display_token text UNIQUE NOT NULL` (gerado via `encode(gen_random_bytes(24),'hex')`)
- `name text NOT NULL`
- `active boolean default true`
- `slide_duration_seconds smallint default 12`
- `created_at`, `updated_at`

**`tv_display_cards`**
- `id uuid pk`, `display_id uuid fk tv_displays ON DELETE CASCADE`
- `card_type text NOT NULL` (enum lógico: `aniversariantes`, `curio_ouro`, `stories_unidade`, `top_pendencias`, `compromissos_semana`, `historias_curio`, `avisos_importantes`, `conquistas_equipe`, `pilula_cultura`)
- `ordem smallint NOT NULL`
- `enabled boolean default true`
- `config jsonb default '{}'::jsonb`
- UNIQUE (display_id, card_type)

**RLS**
- Ambas tabelas: SELECT para master/admin/supervisor; INSERT/UPDATE/DELETE para master/admin.
- Acesso público à TV NÃO usa RLS — é feito via Edge Function com SERVICE ROLE validando o token.

**RPC `seed_default_tv_cards(_display_id uuid)`** — popula 9 cards default ordenados, ativos.

## 2) Edge Function pública `tv-feed` (verify_jwt = false)

Endpoint único que recebe `?token=...` e devolve **todo o payload** consolidado num JSON, evitando múltiplas roundtrips do front:

```
GET /functions/v1/tv-feed?token=XYZ
→ {
  display: { id, name, unit_id, unit_name, slide_duration_seconds },
  cards: [{ type, config, data }],
  generated_at
}
```

Internamente:
- Valida token (busca tv_displays ativo).
- Para cada card habilitado, executa query READ-ONLY na tabela correspondente (aniversariantes hoje, Curió de Ouro últimos 7d, stories 24h, top pendências via `fn_heatmap_indicators`, compromissos completed da semana, histórias aprovadas recentes, avisos ativos urgentes, achievements desbloqueados últimos 7d, pílula de cultura do dia).
- `Cache-Control: public, max-age=60` no response.
- Sem permitir escrita.

## 3) Frontend

### `/tv/:token` (rota pública, fora de AppLayout/SidebarProvider)
- Componente `TvDisplay.tsx` — fullscreen, sem header/sidebar/footer.
- Layout 16:9 com `aspect-video` e `bg-background` forte.
- Hook `useTvFeed(token)` com TanStack Query: `staleTime: 55s`, `refetchInterval: 60s`.
- Carrossel auto-rotativo com Embla (já presente no projeto) ou interval state.
- Cada slide = componente dedicado em `src/components/tv/cards/`:
  - `BirthdayCard.tsx`, `CurioOuroCard.tsx`, `StoriesCard.tsx`, `PendenciasCard.tsx`, `CompromissosCard.tsx`, `HistoriasCard.tsx`, `AvisosCard.tsx`, `ConquistasCard.tsx`, `PilulaCulturaCard.tsx`
- Tipografia grande (text-6xl/7xl headings, text-3xl body), padding generoso, transições `animate-fade-in` + `animate-scale-in`.
- Wake lock API quando suportado (mantém TV acordada).
- Tela de erro elegante se token inválido (`TvInvalidToken.tsx`).
- Indicador discreto de progresso da rotação no canto.

### `/admin/tv-displays` (master/admin/supervisor — gate `RhAdminOnly` + supervisor)
- Página `AdminTvDisplays.tsx`:
  - Lista todos displays agrupados por unidade.
  - Botão "Nova TV" → modal com nome + unit_id, gera slug e token automaticamente, chama `seed_default_tv_cards`.
  - Linha por display com: status, URL pública, ações (copiar URL, ver QR, editar cards, ativar/desativar, regerar token, excluir).
  - Modal "Cards" com checkbox por card_type + drag-to-reorder simples (setas ↑↓).
  - Modal "QR Code" usando lib `qrcode` (já instalada? se não, `bun add qrcode @types/qrcode`).
  - Modal "Preview" abre iframe `/tv/:token` em 16:9 reduzido.

### Hooks/utilitários
- `src/hooks/useTvDisplays.ts` (CRUD admin via supabase client).
- `src/hooks/useTvFeed.ts` (chamada pública à edge function).

## 4) Navegação

- `AppSidebar.tsx`: adicionar item "Admin · TVs" visível só para master/admin/supervisor.
- `App.tsx`:
  - `/tv/:token` montada **fora** do `<AppLayout>` (público, sem providers de auth pesados).
  - `/admin/tv-displays` dentro do layout normal, gate de role.

## 5) Regras / segurança

- Token público mas API só lê. Nenhuma mutação aceita o token.
- Token regenerável (invalida URL antiga).
- RLS bloqueia leitura direta das tabelas via anon — só edge function (service role) responde ao token.
- Performance: 1 request/min por TV. Edge function consolida tudo. Query client mantém cache.

## 6) Arquivos previstos

**Criados**
- `supabase/migrations/<ts>_tv_displays.sql`
- `supabase/functions/tv-feed/index.ts`
- `src/pages/TvDisplay.tsx`
- `src/pages/AdminTvDisplays.tsx`
- `src/components/tv/TvCarousel.tsx`
- `src/components/tv/TvInvalidToken.tsx`
- `src/components/tv/cards/*.tsx` (9 cards)
- `src/components/tv/admin/TvDisplayFormModal.tsx`
- `src/components/tv/admin/TvCardsModal.tsx`
- `src/components/tv/admin/TvQrCodeModal.tsx`
- `src/components/tv/admin/TvPreviewModal.tsx`
- `src/hooks/useTvFeed.ts`
- `src/hooks/useTvDisplays.ts`

**Editados**
- `src/App.tsx` (rotas)
- `src/components/AppSidebar.tsx` (item admin)
- `.lovable/plan.md`
- (auto) `src/integrations/supabase/types.ts`

**Dependência nova (se faltar)**: `qrcode` + `@types/qrcode`.

Aprova pra eu executar?