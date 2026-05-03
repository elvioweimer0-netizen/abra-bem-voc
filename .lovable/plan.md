# Heatmap de Pendências por Unidade

Visão consolidada de 8 indicadores operacionais por unidade, com cores progressivas e drill-down via deep link.

---

## 1. Banco de Dados (migration única)

### Função SQL agregadora
Em vez de uma view (que não suporta parâmetro de período de forma natural), criar **`public.fn_heatmap_indicators(_period text)`** retornando `setof record` com:
- `unit_id uuid`
- `total_advertencias int`
- `total_ocorrencias int`
- `total_suspensoes int`
- `total_checklist_atrasados int`
- `total_faltas_setor int`
- `total_vagas_abertas int`
- `mood_baixo_count int`
- `avisos_pendentes int`

Características:
- `SECURITY INVOKER` + `STABLE` + `SET search_path=public` — herda RLS do chamador.
- `_period in ('hoje','semana','mes','trimestre')` → traduz para `interval`.
- **Graceful degradation**: cada indicador é calculado em sub-CTE com `to_regclass('public.<tabela>')`; se NULL, retorna 0.
- Itera sobre `units` para garantir linha por unidade (mesmo zerada).

Adicionalmente, criar **view `public.v_heatmap_indicators`** que chama a função com período `'mes'` por padrão (atalho para uso direto), também `security_invoker=on`.

Frontend chama via `supabase.rpc('fn_heatmap_indicators', { _period })`.

### Mapeamento dos indicadores
| Indicador | Fonte | Janela |
|---|---|---|
| Advertências | `advertencias` (via `colaboradores.unidade` → `units.code`) | Período |
| Ocorrências | `leadership_occurrences.unit_id` | Período |
| Suspensões | `suspensoes` (via `colaboradores.unidade`) | Período |
| Checklist atrasado | `checklist_completions` esperados − completos do dia | Hoje sempre |
| Faltas setor | `attendance_records.status='falta'` | Período |
| Vagas abertas | `team_members` ativos sem `user_id` OU sem `profiles` ativo | snapshot atual |
| Humor baixo | `daily_mood.score < 3` agregado por `unit_id` | últimos 7 dias |
| Avisos pendentes | `avisos.urgente=true` ativos sem `aviso_reads` para >50% da unidade | snapshot atual |

`to_regclass` blinda cada CTE — se a tabela não existir, retorna 0.

---

## 2. Frontend

### Hook
`src/hooks/useHeatmap.ts`
- `useHeatmap(period)` → chama `rpc('fn_heatmap_indicators')`, cruza com `useAccessibleUnits()` para filtrar só as visíveis.
- `refetchInterval: 60_000`.

### Componentes
- `src/components/heatmap/HeatmapTable.tsx` — tabela 8×N (linhas = indicadores, colunas = unidades).
- `src/components/heatmap/HeatmapCell.tsx` — célula com número grande, cor por threshold.
- `src/components/heatmap/HeatmapDetailDrawer.tsx` — `Sheet` lateral com lista resumida + botão "Abrir página completa" usando deep link:
  - Advertências → `/advertencias?unit=...`
  - Ocorrências → `/ocorrencias?unit=...`
  - Suspensões → `/suspensoes?unit=...`
  - Checklist → `/checklist-diario?unit=...`
  - Faltas → `/escala-semana?unit=...`
  - Vagas → `/colaboradores?unit=...&status=vaga`
  - Humor baixo → `/clima?unit=...`
  - Avisos pendentes → `/avisos?urgente=1`
- `src/components/heatmap/PeriodChips.tsx` — chips "Hoje / Semana / Mês / Trimestre".

### Thresholds
```ts
const THRESHOLDS = {
  advertencias:    [0, 2],   // 0=verde, 1-2=amarelo, 3+=vermelho
  ocorrencias:     [0, 1],
  suspensoes:      [0, 0],   // qualquer >0 já amarelo
  checklist:       [0, 2],
  faltas:          [0, 1],
  vagas:           [0, 0],
  mood_baixo:      [0, 3],
  avisos_pend:     [0, 0],
};
// retorna bg-emerald-50 / bg-amber-50 / bg-rose-50 / bg-rose-200
```

### Página
`src/pages/Heatmap.tsx` — header com título, `<PeriodChips>`, botão refresh manual, `<HeatmapTable>`.

### Rota e guard
`src/App.tsx`:
```tsx
<Route path="/heatmap" element={<HeatmapAccess><Heatmap /></HeatmapAccess>} />
```
`HeatmapAccess` aceita `master | admin | supervisor | gerente_adm`; outros → `<NotFound />`.

### Sidebar
`src/components/AppSidebar.tsx` — nova seção **"Análise"** com item "Heatmap" (ícone `LayoutGrid`), visível apenas para os 4 perfis.

---

## 3. Arquivos tocados

**Migration**
- `supabase/migrations/<ts>_heatmap_indicators.sql` (função `fn_heatmap_indicators` + view `v_heatmap_indicators`)

**Frontend criados**
- `src/hooks/useHeatmap.ts`
- `src/pages/Heatmap.tsx`
- `src/components/heatmap/HeatmapTable.tsx`
- `src/components/heatmap/HeatmapCell.tsx`
- `src/components/heatmap/HeatmapDetailDrawer.tsx`
- `src/components/heatmap/PeriodChips.tsx`

**Frontend editados**
- `src/App.tsx` (rota + guard)
- `src/components/AppSidebar.tsx` (seção Análise)

---

Aprova pra eu executar?
