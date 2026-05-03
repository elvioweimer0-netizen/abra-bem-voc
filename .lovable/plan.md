# Plano — Feature "Iniciar meu dia"

Briefing de turno em 1 clique pra perfis líderes (admin, supervisor, gerente, gerente_loja, gerente_adm, encarregado).

## 1) Banco de dados (migration única)

### Tabela `day_starts`
```sql
CREATE TABLE public.day_starts (
  id uuid PK default gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  unit_id uuid REFERENCES units(id),
  snapshot jsonb
);
CREATE INDEX idx_day_starts_user_started ON day_starts(user_id, started_at DESC);
```

### RLS
- `SELECT`: `user_id = auth.uid()` (+ admins/master via `has_role`)
- `INSERT`: `user_id = auth.uid()`
- Sem UPDATE/DELETE pra usuário comum

### View `v_my_day_overview` (SECURITY INVOKER)
Retorna pro `auth.uid()` corrente:
- `unit_id`, `nome`
- `mood_avg_today` (avg de `daily_mood` últimas 24h da unidade)
- `checklist_pendente_count` (templates ativos − completions de hoje)
- `ocorrencias_abertas_count` (`leadership_occurrences` da unidade sem resolução)
- `top_acoes` (jsonb): compromissos vencendo + avisos urgentes não lidos + metas PDI próximas do prazo (top 3)
- `proxima_reuniao` (huddle 9:30 hoje)
- `ultimo_curio_ouro` (último praise recebido)
- `aniversariantes_hoje` (jsonb agregado da unidade)
- `day_started_today` (boolean), `day_started_at`

Toda a view com `LEFT JOIN` + `COALESCE` + `EXCEPTION WHEN OTHERS` em wrapper SQL function pra graceful degradation.

## 2) Edge function `day-start-reminders` (cron 07:00 BRT)

- Pra cada gerente/encarregado ativo sem registro em `day_starts` hoje
- Insere em `notification_events`: type `day_start_reminder`, "Bom dia! Toque pra iniciar seu dia 🌅"
- Falha graciosamente

Cron via `pg_cron` + `pg_net` (10:00 UTC = 07:00 BRT).

## 3) Frontend

### Hook `src/hooks/useDayStart.ts`
- `useMyDayOverview()` — query única na view (5min staleTime)
- `useStartMyDay()` — mutation: insere em `day_starts` + invalida cache

### Componente `src/components/day-start/IniciarMeuDiaCard.tsx`
- Card destaque no topo do `Dashboard.tsx` (acima do `CartaCuriozinhoCard`) pra perfis líderes
- Estado A (não iniciado): botão grande `bg-primary` "🌅 Iniciar meu dia"
- Estado B (iniciado): "Dia iniciado às HH:MM ✓" + botão outline "Ver briefing"
- Click → abre `IniciarMeuDiaModal`

### Componente `src/components/day-start/IniciarMeuDiaModal.tsx`
Dialog fullscreen com seções (cada uma com fallback gracioso):
1. Saudação "Bom dia, {firstName}!" + data formatada
2. **Sua loja agora**: 3 mini-stats (humor, checklists, ocorrências)
3. **Top 3 ações de hoje**: lista com deep links
4. **Próxima reunião**: card huddle 9:30 com link `/daily-huddle`
5. **Último Curió de Ouro**: card emocional
6. **Aniversariantes hoje** (condicional): chips com nomes
7. CTA `Iniciar agora` → chama `useStartMyDay`, snapshot = dados da view, fecha modal

Visibilidade só pra `isLider` (do `useRole`).

### Integração
- `Dashboard.tsx`: render `<IniciarMeuDiaCard />` no topo (condicional `isLider`)
- `supabase/config.toml`: registrar `day-start-reminders` com `verify_jwt = false`

## 4) Regras técnicas
- Migration única, idempotente (`IF NOT EXISTS`)
- Não tocar RLS de outras tabelas
- View com `security_invoker = on` → herda RLS automático
- Mutation insere com `user_id: auth.uid()` + `unit_id` do profile

## Arquivos a tocar
**Criados:**
- `supabase/migrations/<ts>_day_starts.sql`
- `supabase/functions/day-start-reminders/index.ts`
- `src/hooks/useDayStart.ts`
- `src/components/day-start/IniciarMeuDiaCard.tsx`
- `src/components/day-start/IniciarMeuDiaModal.tsx`

**Editados:**
- `src/pages/Dashboard.tsx` (insere card)
- `supabase/config.toml` (registra função)
- `src/integrations/supabase/types.ts` (auto)

Aprova?