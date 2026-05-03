# Plano — Checklist por Voz

Preenchimento de checklist via fala. Gerente fala "abri a loja, conferi o caixa, limpei a vitrine" e o sistema identifica e marca os itens correspondentes.

## 1) Banco de dados
**Nenhuma migration.** Usa `checklist_items` e `checklist_item_responses` existentes.

## 2) Edge function `process-voice-checklist`

**Arquivo:** `supabase/functions/process-voice-checklist/index.ts`

- Input: `{ transcript: string, items: Array<{id, descricao, tipo_resposta, requires_photo}> }`
- Chama Lovable AI Gateway (`google/gemini-3-flash-preview`) com tool calling estruturado
- Prompt: identifica quais itens da lista o gerente afirmou ter cumprido, considerando sinônimos pt-BR e contexto
- Retorna:
```json
{
  "matches": [
    { "item_id": "uuid", "confidence": "high|medium|low", "evidence": "trecho do texto" }
  ]
}
```
- `verify_jwt = false` registrado em `supabase/config.toml`
- Trata 429/402 retornando erro JSON pro client
- CORS padrão

## 3) Frontend

### 3.1) `src/components/checklist/ChecklistVoiceButton.tsx` (novo)
- Detecta `window.SpeechRecognition || window.webkitSpeechRecognition`. Se ausente → retorna `null` (botão escondido)
- Estados: `idle | listening | processing`
- Botão grande primary com ícone `Mic` (idle) / `MicOff` pulsante (listening)
- `lang = "pt-BR"`, `continuous = true`, `interimResults = true`
- Mostra transcrição parcial em tempo real abaixo do botão
- "Parar" → finaliza recognition + dispara `onTranscript(finalText)`
- Trata `onerror`: `not-allowed` → toast "Permita microfone nas configurações do navegador"

### 3.2) `src/components/checklist/VoiceConfirmModal.tsx` (novo)
Dialog disparado após processamento da edge function. Lista todos os `activeItems`:
- **Verde + check**: confidence `high` → pré-marcado
- **Amarelo + "Confirme:"**: confidence `medium` → pré-marcado mas destacado
- **Cinza**: não identificado → desmarcado
- Itens com `requires_photo` que não têm foto: força desmarcado + aviso "Foto obrigatória — marque manualmente após capturar"
- Toggle individual em cada item
- Mostra trecho `evidence` em texto pequeno
- Botão "Confirmar e salvar" → callback com lista de `item_ids` confirmados
- Botão "Cancelar"

### 3.3) Integração em `src/pages/ChecklistDiario.tsx`
- Renderiza `<ChecklistVoiceButton>` no topo (acima do `<Tabs>`), só quando há `activeItems` e não está em modo visita
- Handler `handleVoiceTranscript`:
  1. `setProcessing(true)` 
  2. `supabase.functions.invoke('process-voice-checklist', { body: { transcript, items: activeItems.map(...) } })`
  3. Se sucesso: abre `VoiceConfirmModal` com matches
  4. Se erro: toast de erro + mostra transcript em alert pra marcação manual
- Handler `handleVoiceConfirm(itemIds)`:
  - Aplica em batch: pra cada `item_id` chama `markItem(item, true)` (respeitando regra de foto obrigatória)
  - Fecha modal + toast "X itens marcados por voz"
  - Usuário ainda precisa clicar "Salvar" no final pra persistir (mantém fluxo atual)

## 4) Permissões & Fallback
- Permissão pedida automaticamente pelo browser na 1ª chamada `recognition.start()`
- Negada → toast com instrução
- API ausente (Safari iOS antigo, Firefox) → componente retorna `null`, fluxo manual intacto
- Edge function falhar → transcript fica visível + toast "Marque manualmente os itens"

## 5) Tipos globais
Adicionar declaração mínima em `src/vite-env.d.ts` pra `SpeechRecognition` (evita erro TS).

## Arquivos tocados
**Criados:**
- `supabase/functions/process-voice-checklist/index.ts`
- `src/components/checklist/ChecklistVoiceButton.tsx`
- `src/components/checklist/VoiceConfirmModal.tsx`

**Editados:**
- `src/pages/ChecklistDiario.tsx` (integração)
- `src/vite-env.d.ts` (tipos SpeechRecognition)
- `supabase/config.toml` (registro da função)

Aprova?
