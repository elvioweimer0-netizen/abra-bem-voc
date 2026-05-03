# Aniversariantes + Reconhecimento — Plano

Detecta aniversariantes do dia, mostra widget no Painel/Feed, banner pro próprio aniversariante, e permite "Parabenizar" com mensagem (registrada em `birthday_messages` + post automático em `praises` quando aplicável).

## Constatações importantes (afetam o desenho)

1. `profiles` ainda não tem `data_nascimento` — adiciono nullable.
2. `praises.destinatario_id` → **`team_members(id)`**, não `profiles`. `motivo` exige ≥20 chars e `unit_id NOT NULL`. Logo:
   - Só vou criar praise automático **se o aniversariante tiver `team_members` ativo**; caso contrário, registro só em `birthday_messages` (silencioso). Isso evita falhas em colaboradores admin/central sem team_members.
   - Categoria nova `aniversario` adicionada ao enum `praise_category`.
   - Texto padrão garante ≥20 chars: `"Parabéns pelo seu aniversário! 🎂 — {mensagem opcional}"`.
3. Privacidade `data_nascimento`:
   - Coluna na `profiles`. Não vou criar policy nova (já existem policies em `profiles` que separam o que cada role enxerga). Em vez disso, exponho **views agregadas** (`v_aniversariantes_*`) que retornam apenas `user_id, nome, foto_url/avatar_url, cargo, setor, unidade, day, month` — **nunca o ano** — pra widget público. A coluna `data_nascimento` em `profiles` permanece visível conforme RLS atual; gerentes/admin/RH veem ano completo na tela do colaborador.

## 1. Schema (migration única)

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_nascimento date;
ALTER TYPE public.praise_category ADD VALUE IF NOT EXISTS 'aniversario';

CREATE TABLE public.birthday_messages (
  id uuid PK,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  message_text text NOT NULL DEFAULT 'Parabéns! 🎉' CHECK (length(message_text) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX birthday_msg_daily_uidx ON public.birthday_messages
  (from_user_id, to_user_id, (created_at AT TIME ZONE 'America/Sao_Paulo')::date);
CREATE INDEX birthday_msg_to_idx ON public.birthday_messages (to_user_id, created_at DESC);

-- Views (SECURITY INVOKER por padrão)
CREATE VIEW public.v_aniversariantes_hoje AS
SELECT p.user_id, p.nome, p.avatar_url, p.cargo, p.setor, p.unidade,
       extract(day FROM p.data_nascimento)::int   AS dia,
       extract(month FROM p.data_nascimento)::int AS mes
FROM public.profiles p
WHERE p.ativo = true AND p.data_nascimento IS NOT NULL
  AND extract(day FROM p.data_nascimento)   = extract(day FROM (now() AT TIME ZONE 'America/Sao_Paulo'))
  AND extract(month FROM p.data_nascimento) = extract(month FROM (now() AT TIME ZONE 'America/Sao_Paulo'));

CREATE VIEW public.v_aniversariantes_proximos_7d AS
SELECT p.user_id, p.nome, p.avatar_url, p.cargo, p.setor, p.unidade,
       extract(day FROM p.data_nascimento)::int   AS dia,
       extract(month FROM p.data_nascimento)::int AS mes,
       /* dias até próximo aniversário, ignorando ano */
       ((make_date(extract(year FROM (now() AT TIME ZONE 'America/Sao_Paulo'))::int,
                   extract(month FROM p.data_nascimento)::int,
                   extract(day FROM p.data_nascimento)::int)
        - (now() AT TIME ZONE 'America/Sao_Paulo')::date) + 365) % 365 AS days_ahead
FROM public.profiles p
WHERE p.ativo = true AND p.data_nascimento IS NOT NULL
ORDER BY days_ahead;
```
> Filtro 1..7 aplicado no front (`days_ahead BETWEEN 1 AND 7`) — view permanece reusável.

## 2. RLS `birthday_messages`

- SELECT authenticated: `true` (público entre autenticados — mensagens de parabéns são públicas).
- INSERT authenticated: `from_user_id = auth.uid()`.
- DELETE authenticated: `from_user_id = auth.uid()`.
- (sem UPDATE)

**Não toco RLS de `profiles`, `praises` nem `team_members`.**

## 3. Frontend

### Hook `src/hooks/useBirthdays.ts`
- `useAniversariantesHoje()` → `from('v_aniversariantes_hoje')`
- `useAniversariantesProximos7d()` → filtra `days_ahead ∈ [1,7]`
- `useBirthdayMessages(toUserId, dateISO)` → quem já parabenizou hoje (com perfil)
- `useSendBirthdayMessage()` → mutation: insert em `birthday_messages` + tenta criar praise automático.

### Componentes (`src/components/birthdays/`)
- `AniversariantesWidget.tsx` — card destacado se há hoje (avatar, nome, cargo, botão Parabenizar). Accordion "Próximos 7 dias" abaixo.
- `ParabenizarModal.tsx` — textarea opcional (max 200), submit chama hook.
- `BirthdayBanner.tsx` — sticky topo se hoje é meu aniversário; mostra avatares de quem parabenizou; X fecha (localStorage `birthday_banner_dismissed_{YYYY-MM-DD}`).
- `BirthdayWishesList.tsx` — lista de mensagens recebidas (usado em `MeuPerfil`/`ColaboradorPerfil`).

### Lógica de auto-praise (no hook)
```ts
1. insert birthday_messages (from=me, to=aniversariante, message_text=mensagem||default)
2. lookup team_members onde user_id=aniversariante AND ativo
3. se encontrar 1+: pega primeiro (ou da unidade do autor se houver match), insert em praises:
   { autor_id: me, destinatario_id: tm.id, unit_id: tm.unit_id,
     categoria: 'aniversario', publico: true,
     motivo: `Parabéns pelo seu aniversário! 🎂 ${mensagem ?? ''}`.padEnd(20) }
4. se RLS rejeitar praise → silencioso (toast.success igual; birthday_message já registrada).
```

### Integrações
- `src/pages/FeedColaborador.tsx`: `<AniversariantesWidget />` abaixo do `AvisosBanner`.
- `src/pages/Dashboard.tsx`: idem (ou em coluna lateral, conforme estrutura).
- `src/components/AppLayout.tsx`: `<BirthdayBanner />` montado dentro do layout autenticado (acima do conteúdo).
- `src/pages/MeuPerfil.tsx`: seção "Mensagens de aniversário" via `BirthdayWishesList`.
- `src/pages/ColaboradorPerfil.tsx`: mostra `data_nascimento` formatada (DD/MM, ano só pra admin/master/gerente_adm RH) + `BirthdayWishesList` agregando histórico.

## 4. Admin (gestão de usuários)
- `src/components/gestao-usuarios/UserEditDialog.tsx`: novo input `data_nascimento` (`<Input type="date" />`), validação client zod: idade 16–80; só visível/editável pra master/admin/gerente_adm RH. Outros roles veem o campo desabilitado/escondido.

## 5. Notificações
- Edge functions/cron existentes não tocam aqui. Trigger SQL `after insert on birthday_messages` enfileira `notification_events` pro `to_user_id`:
  - type `birthday_wish`, body `"{from_nome} te parabenizou pelo aniversário 🎉"`, payload `{ from_user_id, message_id }`.

## 6. Validações (zod)
- `birthdaySchema = z.object({ data_nascimento: z.coerce.date().refine(d => idade ∈ [16,80]) })`
- `wishSchema = z.object({ message_text: z.string().trim().max(200).optional() })`

## 7. Regras

- Migration única: coluna + enum value + tabela + 2 views + trigger de notificação + RLS de `birthday_messages`.
- Sem mexer em RLS de `profiles`, `praises`, `team_members`.
- Auto-praise é "best-effort": falha não interrompe mensagem.
- View `v_aniversariantes_*` esconde ano de nascimento.
- Banner com `localStorage` por dia.

## 8. Arquivos tocados

**Novos:**
- `supabase/migrations/<ts>_birthdays.sql`
- `src/hooks/useBirthdays.ts`
- `src/components/birthdays/AniversariantesWidget.tsx`
- `src/components/birthdays/ParabenizarModal.tsx`
- `src/components/birthdays/BirthdayBanner.tsx`
- `src/components/birthdays/BirthdayWishesList.tsx`

**Editados:**
- `src/pages/FeedColaborador.tsx`
- `src/pages/Dashboard.tsx`
- `src/components/AppLayout.tsx` (montar `BirthdayBanner`)
- `src/pages/MeuPerfil.tsx`
- `src/pages/ColaboradorPerfil.tsx`
- `src/components/gestao-usuarios/UserEditDialog.tsx`
- `src/integrations/supabase/types.ts` (auto)
- `.lovable/plan.md`

Aprova pra eu executar?
