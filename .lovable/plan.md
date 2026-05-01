## Plano: Experiência diferenciada Líder vs Colaborador

Tudo em frontend, num único commit. Sem mexer em RLS, helpers ou permissões reais do banco.

### 1. `useRole.ts` — adicionar flag `isLider`
- Constante `LEADER_ROLES = ["master","admin","supervisor","gerente","gerente_loja","gerente_adm","encarregado","fiscal"]`
- Constante `FEED_ROLES = ["lider_setor","colaborador"]`
- Exportar `isLider` (cargo simulado é líder) e `isFeedUser` (cargo é lider_setor/colaborador)

### 2. `ViewAsContext.tsx` — expandir simulação
- `role: Role | null` (null = "ver como eu mesmo", padrão)
- Adicionar todos os 10 cargos como opção (não só 4)
- Adicionar flag derivada `isSimulating` (role !== null e ≠ realCargo)
- `useRole` passa a usar `role ?? realCargo` quando admin/master
- Garantir que `isRealAdmin` continua usando SEMPRE `realCargo` (queries reais não mudam)

### 3. Novo componente `src/pages/FeedColaborador.tsx`
- Saudação "Olá, {primeiro_nome}"
- `<AvisosBanner />` (avisos importantes existentes)
- Lista de notícias recentes (cards: título, data, descrição curta)
- Grid 2 colunas com 4 atalhos: Falar com RH (`/central-adm/rh`), Documentos (`/rh/cartilha`), Galeria (`/galeria`), Curiózinho (`/assistente`)
- Se `isLiderSetor`: card extra "Minha Equipe" listando profiles onde `lider_setor_id = profile.id` (nome + cargo)
- SEM cards de métricas

### 4. `Dashboard.tsx` — roteamento por perfil
- No topo: `if (isFeedUser) return <FeedColaborador />;`
- Resto do dashboard atual fica intacto pra líderes

### 5. Guard de rota
- Em `App.tsx`, criar wrapper `<LeaderOnlyRoute>` que checa `useRole().isLider`; se não, `<Navigate to="/" replace />`
- Aplicar em: `/colaboradores`, `/colaboradores/:id`, `/advertencias`, `/suspensoes`, `/departamentos`, `/relatorios`

### 6. `AppSidebar.tsx` — menu dinâmico
- Se `isFeedUser`: mostrar APENAS Início, Avisos, Notícias, Documentos, Galeria, Falar com RH (`/central-adm/rh`), Curiózinho, Meu Perfil, Sair
- Se `isLider`: comportamento atual (com seções operacionais que cada cargo já tem)
- Adicionar bloco "Visualizar como" no topo (somente `isRealAdmin`): select com `eu mesmo + 1 exemplo de cada cargo`. Ao escolher, atualiza `ViewAsContext.role`.

### 7. Banner de simulação
- Novo componente `src/components/SimulationBanner.tsx`
- Renderiza no `AppLayout` quando `isSimulating`: faixa laranja sticky no topo "Visualizando como {cargo}. Clique para voltar." → botão zera o `role`

### 8. `MobileBottomNav.tsx`
- Para `isFeedUser`: itens Início, Avisos, Notícias, Curiózinho, Mais
- Para líderes: comportamento atual

### Arquivos editados/criados
- `src/hooks/useRole.ts` (edit)
- `src/contexts/ViewAsContext.tsx` (edit)
- `src/pages/FeedColaborador.tsx` (new)
- `src/pages/Dashboard.tsx` (edit, mínimo)
- `src/App.tsx` (edit: guard)
- `src/components/AppSidebar.tsx` (edit)
- `src/components/AppHeader.tsx` (edit: select "Visualizar como" passa a oferecer todos os cargos + opção "eu mesmo")
- `src/components/SimulationBanner.tsx` (new)
- `src/components/AppLayout.tsx` (edit: incluir banner)
- `src/components/MobileBottomNav.tsx` (edit)

### Não vou tocar
- RLS / helpers SQL
- `is_leadership`, `has_role`, queries reais
- Edge functions, branding, assets
- Lógica de criação/edição em qualquer página

Confirma e eu executo tudo de uma vez.