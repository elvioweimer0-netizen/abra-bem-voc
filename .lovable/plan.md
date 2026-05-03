# Auditoria Visual Lado a Lado — Plano

Painel para liderança comparar fotos de itens de checklist entre lojas, com filtros, lightbox, modo timeline e ação "cobrar gerente".

---

## 1. Banco — view `v_auditoria_visual` (SECURITY INVOKER)

Sem tabelas novas. Apenas uma view que agrega `checklist_item_responses` + `checklist_items` + `checklist_completions` + `checklist_templates` + `units` + `profiles`.

Colunas:
```
response_id, foto_url, observacao, item_id, item_text, template_id, template_name,
unit_id, unit_name, unit_code, completion_id, completion_data,
gestor_user_id, gestor_nome, gestor_cargo, completed_at
```

`SECURITY INVOKER` (default em PG 15+ via `WITH (security_invoker=true)`) → herda RLS de `checklist_item_responses` e demais.

Filtro inicial na view: `WHERE foto_url IS NOT NULL`.

**Inferência de setor**: como não existe coluna `setor`, derivado no front via match em `item_text`/`template_name` (regex pelas palavras-chave: Açougue, Padaria, Hortifruti, Mercearia, Frente de Caixa/Caixa, Depósito, Geral). Fallback "Geral".

**Graceful degradation**: a view usa LEFT JOINs em profiles/units, e checa `to_regclass` no wrapper para retornar vazio se a view for inválida. Se algum SELECT explodir, o hook captura e retorna `[]`.

---

## 2. Hook `useAuditoriaVisual`

`src/hooks/useAuditoriaVisual.ts`:
- `useAuditoriaResults({ periodo, unitIds, itemId, setor })` → consulta a view, filtra por período (today/yesterday/week/month) e unidades; agrupa por `unit_id` quando `itemId` definido (para grid lado a lado).
- `useAuditoriaItems(setor?)` → lista itens distintos `(item_id, item_text)` que têm `requires_photo=true`.
- `useSignedPhotoUrl(path)` → signed URL do bucket `checklist-photos` (TTL 1h, cache em React Query).

Lazy: usa `Intersection Observer` no card pra só pedir signed URL quando entra no viewport (componente `LazyPhoto`).

---

## 3. Página `/auditoria-visual`

`src/pages/AuditoriaVisual.tsx`:

### Filtros (topo)
- **Setor** (chips): Todos · Açougue · Padaria · Hortifruti · Mercearia · Frente de Caixa · Depósito · Geral
- **Item específico** (Select): filtrado por setor; opção "Todos os itens"
- **Período** (chips): Hoje · Ontem · Semana · Mês
- **Unidades** (chips multi-select de `useAccessibleUnits`); todas selecionadas por padrão; botão "Todas"/"Limpar"

### Modos de visualização (toggle)
- **Comparativo** (default quando item selecionado): grid lado a lado, 4 col desktop / 2x2 mobile, 1 card por loja. Loja sem foto no período → card cinza tracejado "Sem foto registrada".
- **Galeria**: grid livre com todas as fotos no período (cards menores).
- **Timeline** (apenas quando item selecionado): por loja, mostra os últimos 7 dias em linha (mini-cards horizontais com data).

### Card
`src/components/auditoria/AuditoriaPhotoCard.tsx`
- `<LazyPhoto>` com signed URL on-demand
- Badge unidade (canto sup. esq.)
- Hora rodapé + autor
- Click → lightbox

### Lightbox
`src/components/auditoria/AuditoriaLightbox.tsx`
- Foto grande, observação, autor + cargo, data/hora completa
- Link "Abrir checklist" → `/checklist/diario?completion=ID`
- Botão **"Cobrar gerente"** → abre `CobrarGerenteModal`

### Cobrar gerente
`src/components/auditoria/CobrarGerenteModal.tsx`
- Cria registro em `leadership_occurrences` (já existente) com `unit_id` + `motivos: ["operacional"]` + `urgencia: "media"` + título e descrição pré-preenchidos com nome do item, loja e data.
- Após criação, toast e fecha.

### Empty / Skeleton
- Skeleton grid; empty state amigável.

---

## 4. Guard + rota
- `App.tsx`: rota `/auditoria-visual` envolta em `AuditoriaAccess` (master/admin/supervisor/gerente_adm). Outros → `<NotFound/>`.

## 5. Sidebar
- `AppSidebar.tsx`: adiciona item **"Auditoria Visual"** (ícone `Camera` ou `ImageIcon`) na seção **Análise**, mesma condição do Heatmap + gerente_adm.

---

## 6. Setores (constante client-side)
```ts
const SETORES = [
  { key: "acougue",  label: "Açougue",        match: /(açougue|carnes?)/i },
  { key: "padaria",  label: "Padaria",        match: /(padaria|panifica)/i },
  { key: "hortifruti", label: "Hortifruti",   match: /(hortifruti|FLV|frutas?|legumes?|verduras?)/i },
  { key: "mercearia", label: "Mercearia",     match: /(mercearia|gôndola|gondola)/i },
  { key: "caixa",     label: "Frente de Caixa", match: /(caixa|frente de loja|FDL)/i },
  { key: "deposito",  label: "Depósito",      match: /(depósito|deposito|estoque)/i },
  { key: "geral",     label: "Geral",         match: /.*/ },
];
```

---

## Arquivos tocados

**Criados**
- `supabase/migrations/<ts>_v_auditoria_visual.sql`
- `src/hooks/useAuditoriaVisual.ts`
- `src/components/auditoria/AuditoriaPhotoCard.tsx`
- `src/components/auditoria/AuditoriaLightbox.tsx`
- `src/components/auditoria/CobrarGerenteModal.tsx`
- `src/components/auditoria/LazyPhoto.tsx`
- `src/pages/AuditoriaVisual.tsx`
- `src/lib/auditoriaSetores.ts`

**Editados**
- `src/App.tsx` (rota + guard `AuditoriaAccess`)
- `src/components/AppSidebar.tsx` (item "Auditoria Visual" em Análise)
- `src/integrations/supabase/types.ts` (auto)
- `.lovable/plan.md`

Aprova pra eu executar?
