# Plano: Curió de Ouro Peer-to-Peer

Estende a tabela `praises` para suportar três tipos de reconhecimento, com regras de visibilidade/criação por nível hierárquico.

## 1. Schema (migração única)

```sql
ALTER TABLE public.praises
  ADD COLUMN praise_type text NOT NULL DEFAULT 'liderado'
  CHECK (praise_type IN ('liderado','peer','equipe_externa'));

CREATE INDEX idx_praises_praise_type ON public.praises(praise_type);
```

## 2. RLS — atualizar policy de INSERT em `praises`

Substituir a policy atual de INSERT por uma que considere `praise_type`:

- **`liderado`** (default): mantém regra atual (autor é líder do destinatário — autor é gerente/encarregado/supervisor/admin/master da unit/setor do destinatário).
- **`peer`**: permitido quando autor.cargo == destinatario.cargo E autor.user_id != destinatario.user_id E mesma unit_id.
- **`equipe_externa`**: permitido quando o destinatário está em uma `unit_id` presente em `autor.permission_units` (ou autor é admin/master/supervisor) E autor != destinatario.

Helper SQL: `public.can_create_praise(_autor uuid, _destinatario uuid, _type text) RETURNS boolean` (SECURITY DEFINER, STABLE) — encapsula as 3 regras lendo `profiles`. RLS chama esse helper.

Trigger existente `validate_daily_praise_limit` permanece (1 elogio/dia/par autor-destinatário).

## 3. Frontend

**`src/components/praise/NovoPraiseModal.tsx`** (existente — verificar nome real e estender)
- Adicionar `<Select>` "Tipo de elogio" no topo do form.
- Opções dinâmicas pelo `cargo` do autor (via `useRole`):
  - `colaborador`, `fiscal`: oculto, força `liderado` (na verdade `peer` se mesmo cargo? — segue spec: só `liderado`).
  - `encarregado`, `lider_setor`: `liderado` + `peer`.
  - `gerente_loja`, `gerente_adm`, `gerente`: `liderado` + `peer` + `equipe_externa`.
  - `supervisor`, `admin`, `master`: todos os 3.
- Quando `peer` ou `equipe_externa`, lista de destinatários filtra de acordo:
  - peer → mesma unit + mesmo cargo.
  - equipe_externa → units em `permission_units`.
- Insere com `praise_type` selecionado.

**`src/pages/Reconhecimentos.tsx`**
- Filtro "Tipo" (Tabs ou Select): `Todos | Liderado | Peer | Externa`.
- Badge visual em cada card:
  - liderado → `bg-primary/15 text-primary` (vermelho atual)
  - peer → `bg-[hsl(var(--gold))]/20 text-[hsl(var(--gold))]` (dourado)
  - equipe_externa → `bg-blue-500/15 text-blue-600 dark:text-blue-400`
- Helper `praiseTypeLabel(type)` e `praiseTypeBadgeClass(type)` em `src/lib/praises.ts`.

**`src/pages/MeuPerfil.tsx`**
- Card "Elogios recebidos": adicionar 3 contadores agrupados por tipo (Liderado / Peer / Externa) usando os dados de `receivedPraises` (incluir `praise_type` na query).

## 4. Conquista "Diplomata"

- Insert na tabela `achievements` (ou equivalente — checar nome real, é `achievements` ou `achievement_definitions`):
  - `code: 'diplomata'`, `title: 'Diplomata'`, `description: 'Recebeu 5 reconhecimentos de pares ou de outras equipes'`, `icon: '🤝'`, `tier: 'gold'`.
- Lógica de unlock em `src/lib/achievements.ts` (ou hook existente que processa achievements) — adicionar regra:
  - count em `praises` onde `destinatario_id = uid AND praise_type IN ('peer','equipe_externa')` >= 5.
- Inserir via tool `insert` (não migration, é dado).

## 5. Arquivos a tocar

**Edição:**
- `src/components/praise/NovoPraiseModal.tsx` (ou nome equivalente no projeto — vou localizar)
- `src/pages/Reconhecimentos.tsx`
- `src/pages/MeuPerfil.tsx`
- `src/lib/achievements.ts` (regra Diplomata) ou hook equivalente
- `src/integrations/supabase/types.ts` (auto-regenerado após migração)

**Criação:**
- `src/lib/praises.ts` (helpers de label/badge/options-por-cargo)
- Migração SQL única
- Insert: definição da conquista "Diplomata"

## 6. Não escopo
- Não toca RLS de outras tabelas.
- Não muda fluxo de moderação/limite diário.
- Não retroage `praise_type` de praises existentes (ficam todos `liderado` por default).

Aprova pra executar?
