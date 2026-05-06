## Reuniões Online — Reconstrução (plano)

### Pré-passo: descartar tarefas pendentes
Descarto da fila estas 4 tarefas da migração de alocações (voltamos depois):
- Hook `useOrgAlocacoes`
- Abas em `UnidadePage`
- Modal Alocar/Mover
- Integrar alocações no `CidadeAltaOrgTree`

### Escopo
Reconstruir a feature **Reunião Online** ponta-a-ponta, em UM commit reversível, sem mexer em RLS de tabelas existentes nem em features já implantadas.

### Secrets a solicitar
- `DAILY_API_KEY` (dashboard.daily.co)
- `OPENAI_API_KEY` (platform.openai.com)

Peço via `add_secret` antes de codar as edge functions.

### Estado já existente (reaproveitar)
- Edge `create-daily-room` ✅
- Edge `process-meeting-recording` ✅ (Whisper + GPT)
- Tabelas `leadership_meetings`, `meeting_minutes`, `meeting_action_items`, `ai_suggestions` ✅
- Bucket `meeting-recordings` ✅
- Página `ReunioesLideranca.tsx` (referência, não tocar)
- Página `HistoricoReunioes.tsx` (referência)

### O que será criado/alterado

**1. Migration (mínima, aditiva)**
- Coluna `unidade_id uuid null` em `leadership_meetings` (se não existir) para filtrar individuais por loja.
- Índice por `(type, scheduled_date)`.
- Sem alterar RLS existente; apenas garantir policy de SELECT/INSERT por usuário autenticado se faltar para as novas colunas.

**2. Dependência**
- `bun add @daily-co/daily-js`

**3. Nova página `src/pages/Reunioes.tsx`** com 3 abas:
- **Diária** | **Semanal** | **Individuais (por loja)**
- Topo de cada aba: card grande com
  - Status da próxima reunião (data/hora, participantes esperados)
  - Botão primário **Entrar na Sala** → invoca `create-daily-room`, monta iframe via `@daily-co/daily-js` com `startRecording: { type: 'cloud' }` automático ao entrar
  - Botão secundário **WhatsApp (backup)** → abre `wa.me` com link da sala
- Lateral: **Pauta automática** (invoca `generate-meeting-agenda` existente, com fallback para B.O. eletrônico + ações pendentes da última ata)

**4. Subtela Histórico** (dentro de Reuniões, rota `/reunioes/historico`)
- Lista todas as reuniões passadas
- Filtros: tipo (diária/semanal/individual), unidade, período
- Cada item mostra `sentiment` com ícone (😊 positivo / 😐 neutro / 😟 tenso) + título da ata + duração

**5. Nova tela `src/pages/Tarefas.tsx`** (nova entrada no menu)
- Lista `meeting_action_items` agrupados
- Filtros: **Minhas** / **Da unidade** / **Todas**
- Cards coloridos por prazo: verde (>3d), amarelo (≤3d), vermelho (vencido)
- Marcar como concluída

**6. Componente iframe Daily**
- `src/components/reunioes/DailySalaFrame.tsx`
- Usa `DailyIframe.createFrame()`, escuta `recording-started`/`left-meeting`
- Ao sair com gravação, dispara webhook do Daily → `process-meeting-recording` (já existente)

**7. Menu lateral**
- Adiciona item **Reuniões** (rota `/reunioes`) e **Tarefas** (rota `/tarefas`) no `AppLayout` / sidebar conforme padrão existente. Visibilidade: todos os roles autenticados; Individuais só para gerentes/admin.

**8. Rotas em `App.tsx`**
- `/reunioes`, `/reunioes/historico`, `/tarefas`

### Fora de escopo (não mexer)
- `PainelGerenteHumanizado.tsx`
- `Dashboard.tsx`
- Qualquer RLS de tabelas existentes
- `ReunioesLideranca.tsx` (mantida em paralelo até validarmos a nova)

### Validação ao final
- Build verde
- Listo todos os arquivos tocados
- Testo manualmente: abrir `/reunioes`, criar sala, entrar, sair, conferir que ata apareceu em `/reunioes/historico` e ações em `/tarefas`

### Aprovação
Confirma o plano que eu já solicito os 2 secrets e executo tudo num commit só.