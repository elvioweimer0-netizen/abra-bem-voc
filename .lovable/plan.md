# Plano: RECLAMAÇÃO DE CLIENTE

Registro rápido de reclamações de clientes pelo colaborador, gestão pelo gerente da loja, consolidação por admin/supervisor, integração com Heatmap existente.

---

## 1. Schema SQL (migration única)

### Nova tabela `customer_complaints`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid pk | gen_random_uuid() |
| registered_by_user_id | uuid → profiles.id ON DELETE SET NULL | quem registrou |
| unit_id | uuid → units.id NOT NULL | loja onde ocorreu |
| category | text CHECK in (`atendimento`,`produto`,`preco`,`fila`,`limpeza`,`estoque`,`outros`) | |
| severity | text CHECK in (`leve`,`media`,`grave`,`muito_grave`) | |
| description | text NOT NULL | |
| customer_contact | text NULL | nome/telefone/email opcional |
| action_taken | text NULL | ação imediata |
| setor | text NULL | bônus pra padrão de repetição (push RH) |
| status | text CHECK in (`aberta`,`em_andamento`,`resolvida`) DEFAULT `aberta` | |
| resolved_at | timestamptz NULL | |
| resolved_by_user_id | uuid → profiles.id NULL | |
| created_at | timestamptz DEFAULT now() | |
| updated_at | timestamptz DEFAULT now() | trigger |

Índices:
- `(unit_id, created_at DESC)`
- `(status, severity)`
- `(category, setor, created_at)` (pra detectar padrão)

### Triggers
- `tg_complaint_severity_notify` (AFTER INSERT): se `severity IN ('grave','muito_grave')` → push pro gerente da unit (via `notification_events`).
- `tg_complaint_pattern_notify` (AFTER INSERT): conta complaints da mesma `(unit_id, category)` (e `setor` se preenchido) nos últimos 30 dias; se ≥3, push pra usuários com `cargo` em RH (`gerente_adm` da gerência RH ou role específico — usar `cargo='admin' OR profile.gerencia='RH_DP'` conforme convenção do projeto). Se não houver canal RH claro, push pra admin/master.

---

## 2. RLS

### customer_complaints
- **INSERT**: `registered_by_user_id = coverage_profile_id_for(auth.uid())` AND `user_can_access_unit(auth.uid(), unit_id)`.
- **SELECT**:
  - registered_by = self
  - OR `user_can_access_unit(auth.uid(), unit_id)` AND user é gerente_loja/gerente/encarregado/lider_setor (líder da loja vê)
  - OR admin/master/supervisor/gerente_adm
- **UPDATE**: gerente da unit (`user_can_access_unit` + role gerente/gerente_loja) OR admin/master.
- **DELETE**: admin/master apenas.

Helper `coverage_profile_id_for` já existe (criado na feature anterior) — reuso pra map auth.uid → profiles.id.

---

## 3. Frontend

### Hooks novos
- `useCreateComplaint()` — INSERT + invalida queries.
- `useComplaints({ unitId?, category?, severity?, status? })` — lista filtrada.
- `useComplaintTrends()` — agregação por categoria/unit (admin view).

### Componentes
- `ComplaintQuickModal.tsx` — modal rápido (<30s):
  - Chips de categoria (7 opções com emoji)
  - Chips de gravidade (4)
  - Textarea descrição
  - Input contato cliente (opcional)
  - Input ação tomada (opcional)
  - Submit
- `ComplaintCard.tsx` — card de lista com badge categoria/gravidade/status.
- `ComplaintDetailDialog.tsx` — detalhe + ações (resolver, registrar ação).
- `ComplaintFilters.tsx` — filtros categoria/gravidade/status.

### Páginas
- `ReclamacoesPage.tsx` (`/reclamacoes`) — gerente_loja+: lista da unit + filtros + drawer detalhe.
- `AdminReclamacoesPage.tsx` (`/admin/reclamacoes`) — admin/master/supervisor: consolidado das 7 unidades, gráficos por categoria (Recharts BarChart), ranking unidades.

### Botão no Painel/Feed
- Adicionar `<ComplaintTriggerButton />` no `FeedColaborador.tsx` (ou `DailyHuddlePainel`) — botão grande "+ Reclamação de cliente" (visível pra todos colaboradores).

---

## 4. Integração com Heatmap

### Schema/RPC
Atualizar `fn_heatmap_indicators` adicionando coluna `total_complaints integer` à tabela retornada (CTE `comp` que conta complaints da unit no período).

### Frontend
- `useHeatmap.ts`: adicionar `total_complaints` ao tipo.
- `HeatmapTable.tsx`: adicionar entry em `INDICATORS` → `{ key: 'complaints', label: 'Reclamações de cliente', field: 'total_complaints', thresholds: [0, 3] }` → resulta em verde (0), amarelo (1-3), vermelho (4+) conforme regra do `HeatmapCell`.
- `HeatmapDetailDrawer.tsx`: adicionar deep link `complaints: (unitId) => '/reclamacoes?unit=' + unitId`.
- `ReclamacoesPage.tsx` lê query param `?unit=` pra filtrar.

---

## 5. Push notifications
- Convite criado → handled em trigger.
- Tipo: usar `notification_event_type = 'high_occurrence'` (já existe no enum) pra reclamação grave; `weekly_report` ou `high_occurrence` pra padrão repetido.

---

## 6. Rotas + Sidebar
- `App.tsx`: 
  - `/reclamacoes` → `<LeaderOnly><ReclamacoesPage /></LeaderOnly>`
  - `/admin/reclamacoes` → `<AdminOnly><AdminReclamacoesPage /></AdminOnly>`
- `AppSidebar.tsx`:
  - "Reclamações" (ícone MessageCircleWarning) em `operacao` para gerente/admin/supervisor.
  - "Reclamações (admin)" pra admin/supervisor.

---

## 7. Arquivos tocados (previsão)

**Migration:**
- `supabase/migrations/<timestamp>_customer_complaints.sql` (tabela, RLS, triggers, recriação do `fn_heatmap_indicators` incluindo `total_complaints`)

**Hooks (novos):**
- `src/hooks/useComplaints.ts`
- `src/hooks/useCreateComplaint.ts`
- `src/hooks/useComplaintTrends.ts`

**Componentes (novos):**
- `src/components/complaints/ComplaintQuickModal.tsx`
- `src/components/complaints/ComplaintTriggerButton.tsx`
- `src/components/complaints/ComplaintCard.tsx`
- `src/components/complaints/ComplaintDetailDialog.tsx`
- `src/components/complaints/ComplaintFilters.tsx`
- `src/components/complaints/ComplaintTrendsChart.tsx`

**Páginas (novas):**
- `src/pages/ReclamacoesPage.tsx`
- `src/pages/AdminReclamacoesPage.tsx`

**Editados:**
- `src/App.tsx` (rotas)
- `src/components/AppSidebar.tsx` (links + ícone)
- `src/pages/FeedColaborador.tsx` (botão "+ Reclamação")
- `src/hooks/useHeatmap.ts` (campo `total_complaints`)
- `src/components/heatmap/HeatmapTable.tsx` (linha "Reclamações")
- `src/components/heatmap/HeatmapDetailDrawer.tsx` (deep link)
- `src/integrations/supabase/types.ts` (auto)
- `.lovable/plan.md`

---

## 8. Riscos / decisões
- **`fn_heatmap_indicators` recriado** com mesma assinatura + 1 coluna nova. Quem consome via RPC já lida com objetos; campo extra é aditivo.
- **Push RH**: como o projeto não tem canal RH dedicado óbvio, o trigger de padrão repetido envia pra usuários com `gerencia='RH_DP'` (se existir esse enum); senão fallback admin/master. Vou inspecionar `gerencia_tipo` antes de migrar.
- **Validação client-side**: `description` min 10 chars, max 2000; `customer_contact` max 200; `action_taken` max 1000 (zod schema no modal).
- **Único commit reversível**: tudo em uma migration + arquivos novos + edits localizados.

Aprova pra executar?
