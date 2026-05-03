# Command Palette (Cmd+K / Ctrl+K)

Navegação rápida global com busca unificada em pessoas, unidades, avisos, artigos do caderno, páginas e ações rápidas. Sem mudança de schema, RLS herda das tabelas existentes.

## 1) Sem migration

Usa apenas tabelas existentes: `profiles`, `units`, `avisos`, `playbook_articles`. Reads via Supabase client respeitando RLS já configurada.

## 2) Hook `useCommandPalette`

Arquivo: **novo** `src/hooks/useCommandPalette.ts`

- Context provider global (`CommandPaletteProvider`) com estado `{ open, setOpen, toggle }`.
- Listener `keydown` em `window` para `Cmd+K` (Mac) / `Ctrl+K` (Win/Linux) → `e.preventDefault()` + toggle. Ignora se foco em input/textarea já está digitando outro atalho.
- Escape fecha (delegado ao Dialog do shadcn).
- Provider montado no `App.tsx` (ou `AppLayout.tsx`) acima do router para alcance global.

## 3) Componente `CommandPalette`

Arquivo: **novo** `src/components/command-palette/CommandPalette.tsx`

Stack: shadcn `CommandDialog` + `cmdk` (já instalado, ver `src/components/ui/command.tsx`).

Estrutura:
- `<CommandDialog open onOpenChange>` com `<CommandInput placeholder="Buscar pessoas, unidades, páginas, ações..." autoFocus />`.
- `<CommandList>` com 6 `<CommandGroup heading=...>`:
  1. **Páginas** (estático, sempre visível quando query vazio)
  2. **Ações rápidas** (estático)
  3. **Pessoas** (dinâmico)
  4. **Unidades** (dinâmico)
  5. **Avisos** (dinâmico)
  6. **Caderno** (dinâmico)
- Cada `<CommandItem>`: ícone (lucide) + título + subtítulo (cargo/unidade/data) usando classes semânticas (`text-muted-foreground`).
- Filtro: cmdk já filtra automaticamente por substring. Usamos `value` composto (`"nome cargo unidade"`) para casar campos extras.
- Navegação ↑↓/Enter/Esc: nativo do cmdk.

### Categorias

a) **Pessoas** — `profiles.select('user_id, nome, cargo, unidade, foto_url')` limit 200. Click → `navigate('/perfil/' + user_id)` (rota existente: `ColaboradorPerfil` ou `MembroDetalhe` — confirmo no App.tsx ao implementar; fallback: `/colaboradores`).

b) **Unidades** — `units.select('id, nome, codigo')`. Click → `navigate('/unidade/' + id)`.

c) **Avisos** — `avisos.select('id, titulo, created_at').eq('ativo', true).order('created_at', desc).limit(50)`. Click → `/avisos/:id`.

d) **Caderno** — `playbook_articles.select('id, titulo, tags').eq('publicado', true).limit(100)`. Click → `/caderno/:id`.

e) **Páginas** (lista estática):
   - Painel `/painel`, Clima `/clima`, Compromissos `/compromissos`, Heatmap `/heatmap`, Cultura `/cultura`, Conquistas `/conquistas/ranking`, PDI `/pdi`, Auditoria Visual `/auditoria-visual`, Histórias `/historias`, Onboarding `/onboarding`, Meu Score `/meu-score`, Ranking de Scores `/scores/ranking`, TV Displays `/admin/tv-displays`.

f) **Ações rápidas**:
   - "Novo aviso" → `/avisos?new=1` (ou rota existente)
   - "Iniciar reunião 9:30" → `/daily-huddle`
   - "Abrir checklist hoje" → `/checklist-diario`
   - "Dar Curió de Ouro" → `/curio-de-ouro?new=1`

### Cache

- React Query: `useQuery(['cmdk','people'], …, { staleTime: 5 * 60_000, enabled: open })`. Mesmo padrão para units/avisos/articles. Carrega só na 1ª abertura, revalida após 5min.

## 4) Trigger visual no header

Edita: `src/components/AppHeader.tsx`

- Botão entre o lockup central e os ícones da direita (escondido em `<sm`):
  ```tsx
  <button onClick={openPalette} className="hidden md:inline-flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/50 text-xs text-muted-foreground hover:bg-muted">
    <Search className="h-3.5 w-3.5" />
    <span>Buscar...</span>
    <kbd className="ml-2 rounded bg-background px-1.5 py-0.5 text-[10px] font-mono border">⌘K</kbd>
  </button>
  ```
- Visível apenas se `useRole()` retorna cargo em `['master','admin','supervisor','gerente_loja','gerente_adm','encarregado','gerente']`. Atalho global continua funcionando para esses cargos também (gate dentro do listener).

## 5) Acessibilidade

- `autoFocus` no input (já é default do `CommandDialog`).
- `aria-label="Buscar no Conecta Curió"` no `CommandInput`.
- `aria-label` no botão trigger.
- Esc/Tab/setas: nativo do cmdk + Radix Dialog.

## Arquivos tocados

Criados:
- `src/hooks/useCommandPalette.tsx` (Context + Provider + hook + atalho global)
- `src/components/command-palette/CommandPalette.tsx`

Editados:
- `src/App.tsx` (montar `<CommandPaletteProvider>` + `<CommandPalette/>` global)
- `src/components/AppHeader.tsx` (botão trigger gated por cargo)

Garantias:
- Commit único reversível, sem migration.
- RLS herdada de cada tabela; usuário só vê o que já podia ver.
- Sem mudanças em outras features ou políticas.

Aprova?
