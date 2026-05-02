# Mapa de Visitação + Checklist de Visita do Supervisor

Feature nova, isolada, reversível. Não mexe em RLS de tabelas existentes nem nas 4 features recentes (read receipts, foto checklist, semáforo, Curió de Ouro).

---

## 1. Banco de dados (1 migration)

### 1.1 `units`: coordenadas
- Adicionar colunas `latitude numeric`, `longitude numeric` (nullable).
- **Não preencher agora** — você vai me passar os endereços/coords numa mensagem seguinte. Sem coordenadas, o marcador da unidade simplesmente não aparece no mapa (com aviso "unidade sem localização cadastrada").

### 1.2 Enum `checklist_period`: novo valor
- `ALTER TYPE checklist_period ADD VALUE 'visita_supervisor'` (idempotente via `IF NOT EXISTS`).

### 1.3 Template + 6 items
- Inserir 1 `checklist_templates` (`name='Visita do Supervisor'`, `period='visita_supervisor'`, `role_target='supervisor'`, `unit_type='loja'`, `active=true`).
- 6 `checklist_items` na ordem:
  1. FLV organizado — `tipo_resposta=sim_nao`, `requires_photo=true`
  2. Padaria com produto — `sim_nao`, foto
  3. Açougue limpo — `sim_nao`, foto
  4. Atendimento dos colaboradores — `escala` (Alto/Médio/Baixo, reusa o tipo criado pra Cartazeamento), sem foto
  5. Frente de caixa organizada — `sim_nao`, sem foto
  6. Estoque depósito — `texto`, sem foto (campo de observação livre)

> Observação: o pedido cita "com observação" em alguns. Hoje todos os items já permitem `observacao` (campo na resposta). Marquei o tipo de resposta principal de cada um.

### 1.4 Tabela `visit_check_ins`
```text
id              uuid pk default gen_random_uuid()
user_id         uuid not null         (supervisor que visitou — perfil real, sem FK rígida pra auth.users)
unit_id         uuid not null fk units(id) on delete cascade
completion_id   uuid nullable fk checklist_completions(id) on delete set null
check_in_at     timestamptz not null default now()
check_out_at    timestamptz nullable
latitude        numeric nullable
longitude       numeric nullable
observacao      text nullable
created_at / updated_at
```
- Index `(unit_id, check_in_at desc)`.
- Index `(user_id, check_in_at desc)`.
- Trigger `update_updated_at_column`.

### 1.5 RLS `visit_check_ins`
- **INSERT**: `user_id = auth.uid()` AND (`has_role admin/master/supervisor`).
- **SELECT**: `user_id = auth.uid()` OR `has_role admin/master/supervisor` OR (`is_unit_manager(auth.uid(), unit_id)`).
- **UPDATE**: só o próprio supervisor (`user_id = auth.uid()`), e somente para encerrar — trigger `BEFORE UPDATE` que rejeita se `check_out_at` já estava preenchido (encerrar uma vez só) ou se qualquer coluna além de `check_out_at`/`observacao`/`updated_at` mudou.
- **DELETE**: bloqueado.

### 1.6 Relatório de policies criadas
Listo no final do PR: 4 policies em `visit_check_ins` (INSERT/SELECT/UPDATE; DELETE não criada). Nada em outras tabelas.

---

## 2. Frontend

### 2.1 Dependências
- `leaflet` + `react-leaflet` + `@types/leaflet` (OpenStreetMap, sem API key).
- CSS do Leaflet importado uma vez no entry do mapa.

### 2.2 Arquivos novos
- `src/pages/MapaVisitas.tsx` — rota `/mapa-visitas`, gated master/admin/supervisor.
- `src/pages/HistoricoVisitas.tsx` — rota `/historico-visitas`, mesmo gate; filtros unidade/supervisor/período; modal com detalhe (respostas + fotos).
- `src/components/visitas/UnitMarker.tsx` — ícone colorido (verde/amarelo/vermelho/cinza) por dias desde última visita.
- `src/components/visitas/UnitVisitsPanel.tsx` — drawer/sheet lateral: últimas 5 visitas da unidade + botão **Iniciar visita aqui**.
- `src/components/visitas/IniciarVisitaButton.tsx` — captura GPS via `navigator.geolocation.getCurrentPosition`, cria `visit_check_in` + `checklist_completion` (template visita_supervisor), redireciona pra `/checklist-diario?completion=<id>&visita=<visit_id>`.
- `src/components/visitas/EncerrarVisitaBanner.tsx` — banner fixo que aparece em qualquer página enquanto há visita aberta (`check_out_at IS NULL`); botão "Encerrar visita".
- `src/hooks/useVisitaAtiva.ts` — query da visita aberta do supervisor logado.

### 2.3 Arquivos editados
- `src/App.tsx` — registrar 2 rotas novas dentro de `LeaderOnly` + gate adicional por cargo (admin/master/supervisor).
- `src/components/AppSidebar.tsx` — novo grupo **Visitas** com sub-itens **Mapa** e **Histórico**, visível só para admin/master/supervisor.
- `src/pages/ChecklistDiario.tsx` — aceitar query params `?completion=<id>&visita=<id>`: se presentes, carrega esse completion específico (do template visita_supervisor) em vez do checklist diário padrão; ao finalizar, mostra link "Encerrar visita".
- `src/components/AppLayout.tsx` — montar `<EncerrarVisitaBanner/>` (só renderiza se houver visita aberta).

### 2.4 Lógica do mapa
- Carrega `units` com `latitude/longitude not null`.
- Para cada unit: query agregada da última `visit_check_ins.check_in_at`.
- Cor: `≤3d verde`, `4-7d amarelo`, `≥8d vermelho`, `nunca cinza`.
- Click no marcador → abre `UnitVisitsPanel` (Sheet lateral).

### 2.5 PWA / Geo
- Geolocalização pedida só ao clicar **Iniciar visita** (não bloqueia o app).
- Tratamento: `PERMISSION_DENIED` → toast "Permita acesso à localização para registrar visita"; `POSITION_UNAVAILABLE`/`TIMEOUT` → permite registrar visita sem GPS (latitude/longitude null) com toast "Visita registrada sem localização".
- Sem mudanças no `sw.js` ou `manifest.json`.

---

## 3. Arquivos tocados (resumo)

**Migration:** `supabase/migrations/<timestamp>_visit_checkins.sql`

**Novos:**
- `src/pages/MapaVisitas.tsx`
- `src/pages/HistoricoVisitas.tsx`
- `src/components/visitas/UnitMarker.tsx`
- `src/components/visitas/UnitVisitsPanel.tsx`
- `src/components/visitas/IniciarVisitaButton.tsx`
- `src/components/visitas/EncerrarVisitaBanner.tsx`
- `src/hooks/useVisitaAtiva.ts`

**Editados:**
- `src/App.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/AppLayout.tsx`
- `src/pages/ChecklistDiario.tsx`
- `package.json` (deps leaflet)

**Não tocados:** RLS de outras tabelas, hooks de role, features recentes, ViewAsContext, AuthContext.

---

## Confirmações antes de executar

1. **Coordenadas das unidades**: deixo nullable agora, você me passa lat/lng numa próxima mensagem (ou aprova eu rodar geocoding via Nominatim com os endereços que você fornecer)?
2. **Item "Estoque depósito"**: tipo `texto` (campo livre) ou `sim_nao` + observação? Você disse "com observação" — assumi `texto` puro. OK?
3. **Atendimento dos colaboradores**: usar o tipo `escala` (Alto/Médio/Baixo) que já existe? OK?
4. **Visita aberta simultânea**: bloquear iniciar nova visita se já há uma sem `check_out_at`? (recomendo sim, para não duplicar).
