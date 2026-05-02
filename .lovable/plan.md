
# Refatoração Mobile-First — Conecta Curió

Objetivo: 90% dos 240 funcionários vão usar no celular. Tornar o app uma experiência mobile-first sem quebrar o desktop. Todas as 4 features recém-implantadas (read receipts, foto checklist, semáforo, Curió de Ouro), RLS, helpers SQL e queries permanecem intocados.

---

## 1. Bottom Navigation Mobile (`MobileBottomNav.tsx` — refatorar)

- Altura **64px** + `pb-safe` para safe-area iOS, oculto em `md:` (≥768px).
- Ícone ativo: `text-primary` (#B63533) + label semibold; inativo: `text-muted-foreground`.
- Item central "Curiózinho" continua destacado (botão circular elevado).
- **Líder** (`isLider`): Painel (/) | Equipe (rota dinâmica por cargo: minhas-unidades / minha-equipe / meu-setor) | Avisos | Curiózinho | Mais
- **Feed** (`isFeedUser`): Início (/) | Avisos | Curió de Ouro | Curiózinho | Mais
- "Mais" abre o drawer lateral (via `useSidebar().setOpenMobile(true)`) — não abre tela nova; o drawer já lista TUDO (Galeria, Documentos, RH, Meu Perfil, Configurações, Sair).

## 2. Header Mobile (`AppHeader.tsx` — ajustar)

- Altura 56px (atual já é `h-14`).
- Mobile (<md): hambúrguer à esquerda (`SidebarTrigger`, sempre visível — não some quando dá `back`), logo central pequeno (32px de altura, `conecta_curio_claro.png` via `<img>` direto pra economizar), à direita: badge unidade abreviada + sino + avatar.
- Botão "voltar" some no mobile (navegação por bottom nav); permanece no desktop.
- Selects "Visualizar como" continuam só desktop (`lg:flex`).

## 3. Drawer Lateral Mobile

- Já usa `Sidebar collapsible="offcanvas"` que vira Sheet no mobile.
- Ajustar:
  - Largura ~80vw (atual já é configurável via CSS var `--sidebar-width-mobile`).
  - Fundo marrom (#33190F → HSL `18 54% 13%` — já é `--sidebar-background`).
  - Header do drawer: ConectaLockup brown md + bloco com avatar + nome + cargo + unidade (novo).
  - Itens em branco (já está), ícone do item ativo em vermelho (`--sidebar-primary` já é #B63533).
  - Rodapé: botão "Sair" (já existe).
- Desktop: sidebar continua escondida por trás do hambúrguer (sem mudança).

## 4. Tabelas → Cards no Mobile

Já feito em Colaboradores. Aplicar mesmo padrão (Tailwind `md:` prefix, sem duplicar componente):
- `Advertencias.tsx`, `Suspensoes.tsx`, `BoEletronico.tsx` (LeadershipOccurrences): `<div className="space-y-3 md:hidden">…cards…</div>` + `<Table className="hidden md:table">`.
- `Departamentos.tsx`: tabs viram pills com `overflow-x-auto` no mobile.

## 5. Ações Rápidas Home

- `AcoesRapidas.tsx`: já usa `grid-cols-2 sm:grid-cols-3 xl:grid-cols-7`. Confirmar mobile = 2 colunas quadradas (já está). Aumentar levemente o tamanho do ícone no mobile (`w-7 h-7` → `w-8 h-8`).

## 6. Toque-friendly

- Adicionar utilities no `index.css`:
  - `.btn-mobile { min-height: 52px; font-size: 16px; font-weight: 500; }` aplicado via classes em CTAs principais (login, cadastro, "Li e entendi", etc.).
  - Sobrescrever altura mínima de Input via `input { @apply min-h-12; }` no layer base.
- Padding interno de Dialog/Sheet: já é p-6; sobrescrever no mobile via `p-5` global.
- Espaçamento vertical: `space-y-6 md:space-y-8` (padrão já adotado em Dashboard; aplicar em outras pages chave).

## 7. PWA

Manter abordagem atual (manifest + sw.js manual — sem `vite-plugin-pwa`, conforme guia da Lovable que desencoraja PWA dentro de iframe). Manifest e SW já existem; só ajustes:

- `manifest.json`: já tem name "Curió Conecta" → mudar pra **"Conecta Curió"**, manter resto OK.
- `index.html`: meta tags já presentes; adicionar `apple-touch-icon-precomposed` extra e link de splash iOS (opcional).
- Splash screen: novo componente `<PwaSplash/>` que mostra fundo `#B63533` + `conecta_curio_splash_vermelho.png` por 800ms ao iniciar (só quando `display-mode: standalone`), fade-out via CSS.
- SW (`public/sw.js`): trocar estratégia pra **network-first** real para navegação (já é) + cache fallback. Manter `/~oauth` denylist.

**Nota explícita**: o SW só registra fora de iframe/preview (`src/lib/pwa.ts` já trata isso). PWA install/offline funciona apenas no domínio publicado, não no editor da Lovable.

## 8. Web Push Notifications

Backend já tem `push_subscriptions` e `notification_preferences`. Vou:

- Criar Edge Function `send-push` (envio Web Push via VAPID) — **mas** isso requer chaves VAPID que precisam ser geradas/armazenadas como secret. **Vou pedir aprovação separada antes de criar a function**, porque exige `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY`.
- Ampliar `PushPermission.tsx` para, após permissão concedida, criar uma `PushSubscription` no browser (via `serviceWorker.pushManager.subscribe`) e fazer upsert em `push_subscriptions`.
- Adicionar handler `push` no `public/sw.js` (já tem stub) para mostrar notificação.
- Adicionar seção "Notificações" em `MeuPerfil.tsx` usando o componente já existente `NotificationSettings.tsx`.
- Triggers de envio (avisos prioridade alta / Curió de Ouro / advertência) ficam para um **PR de follow-up** — apenas a infra de subscrição entra agora. Confirmar se concorda.

---

## Arquivos a tocar

**Editar:**
- `src/components/MobileBottomNav.tsx` (reescrita: 5 itens dinâmicos por cargo + safe-area)
- `src/components/AppHeader.tsx` (ajuste mobile: hambúrguer sempre visível, badge unidade)
- `src/components/AppSidebar.tsx` (header com avatar/nome/cargo no topo do drawer)
- `src/components/AppLayout.tsx` (montar `<PwaSplash/>`)
- `src/components/dashboard/AcoesRapidas.tsx` (ícone ligeiramente maior mobile)
- `src/pages/Advertencias.tsx`, `src/pages/Suspensoes.tsx`, `src/pages/BoEletronico.tsx`, `src/pages/Departamentos.tsx` (tabela→card mobile)
- `src/pages/MeuPerfil.tsx` (montar `NotificationSettings`)
- `src/components/PushPermission.tsx` (subscrição + upsert)
- `src/index.css` (utilities mobile-friendly)
- `public/manifest.json` (nome "Conecta Curió")
- `public/sw.js` (handler push refinado)
- `index.html` (apple meta extras)

**Criar:**
- `src/components/PwaSplash.tsx`

**NÃO tocar:**
- RLS, helpers SQL, queries, types Supabase, ViewAsContext, AuthContext, useRole.
- Estrutura dos cargos / divisão líder vs feed.
- Componentes das 4 features recentes (AvisoReadButton, AvisoReadStats, ChecklistDiario lógica de foto, CardSemaforoUnidade, CurioDeOuroPage, TopCuriosMes).

---

## Perguntas pra você antes de executar

1. **Web Push (item 8)**: confirma que quer só a **infra de subscrição** agora (browser → tabela `push_subscriptions`)? O **envio real** (Edge Function + VAPID + triggers de aviso/elogio/advertência) vira PR separado quando você gerar as chaves VAPID. OK?
2. **Splash screen**: 800ms está bom ou prefere outro tempo (500ms / 1200ms)?
3. **Header mobile à direita**: badge da unidade + sino + avatar — em telas <375px (iPhone SE) pode ficar apertado. Ok ocultar a badge da unidade em telas muito estreitas (<sm) e mostrar só sino + avatar?
