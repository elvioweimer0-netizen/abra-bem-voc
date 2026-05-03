
-- Tabela day_starts
CREATE TABLE IF NOT EXISTS public.day_starts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  unit_id uuid REFERENCES public.units(id),
  snapshot jsonb
);

CREATE INDEX IF NOT EXISTS idx_day_starts_user_started
  ON public.day_starts(user_id, started_at DESC);

ALTER TABLE public.day_starts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "day_starts_select_own" ON public.day_starts;
CREATE POLICY "day_starts_select_own" ON public.day_starts
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  );

DROP POLICY IF EXISTS "day_starts_insert_own" ON public.day_starts;
CREATE POLICY "day_starts_insert_own" ON public.day_starts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Função wrapper para snapshot do dia (graceful)
CREATE OR REPLACE FUNCTION public.fn_my_day_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _unit_id uuid;
  _nome text;
  _mood numeric;
  _checklist_pend int := 0;
  _occ_open int := 0;
  _day_start record;
  _aniversariantes jsonb := '[]'::jsonb;
  _ultimo_ouro jsonb := null;
  _top_acoes jsonb := '[]'::jsonb;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('error','not_authenticated');
  END IF;

  SELECT unit_id, nome INTO _unit_id, _nome
  FROM public.profiles WHERE user_id = _uid;

  -- mood médio do dia
  BEGIN
    SELECT round(avg(score)::numeric, 2) INTO _mood
    FROM public.daily_mood
    WHERE unit_id = _unit_id
      AND recorded_at >= date_trunc('day', now());
  EXCEPTION WHEN OTHERS THEN _mood := NULL; END;

  -- checklists pendentes hoje
  BEGIN
    SELECT GREATEST(
      (SELECT count(*) FROM public.checklist_templates WHERE active = true)
      - (SELECT count(*) FROM public.checklist_completions
         WHERE unit_id = _unit_id AND data = CURRENT_DATE
           AND status = 'completo'::checklist_status),
      0
    )::int INTO _checklist_pend;
  EXCEPTION WHEN OTHERS THEN _checklist_pend := 0; END;

  -- ocorrências abertas
  BEGIN
    SELECT count(*)::int INTO _occ_open
    FROM public.leadership_occurrences
    WHERE unit_id = _unit_id
      AND created_at >= now() - interval '7 days';
  EXCEPTION WHEN OTHERS THEN _occ_open := 0; END;

  -- aniversariantes hoje (mesma unidade)
  BEGIN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('nome', nome, 'user_id', user_id)), '[]'::jsonb)
    INTO _aniversariantes
    FROM public.profiles
    WHERE unit_id = _unit_id
      AND ativo = true
      AND data_nascimento IS NOT NULL
      AND to_char(data_nascimento, 'MM-DD') = to_char(CURRENT_DATE, 'MM-DD');
  EXCEPTION WHEN OTHERS THEN _aniversariantes := '[]'::jsonb; END;

  -- último Curió de Ouro recebido (praises)
  BEGIN
    SELECT to_jsonb(t) INTO _ultimo_ouro FROM (
      SELECT mensagem, criado_em, autor_id
      FROM public.praises
      WHERE destinatario_id = _uid
      ORDER BY criado_em DESC
      LIMIT 1
    ) t;
  EXCEPTION WHEN OTHERS THEN _ultimo_ouro := NULL; END;

  -- início do dia hoje
  SELECT id, started_at INTO _day_start
  FROM public.day_starts
  WHERE user_id = _uid
    AND started_at >= date_trunc('day', now())
  ORDER BY started_at DESC LIMIT 1;

  RETURN jsonb_build_object(
    'user_id', _uid,
    'nome', _nome,
    'unit_id', _unit_id,
    'mood_avg_today', _mood,
    'checklist_pendente_count', _checklist_pend,
    'ocorrencias_abertas_count', _occ_open,
    'aniversariantes_hoje', _aniversariantes,
    'ultimo_curio_ouro', _ultimo_ouro,
    'top_acoes', _top_acoes,
    'day_started_today', (_day_start.id IS NOT NULL),
    'day_started_at', _day_start.started_at
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_my_day_overview() TO authenticated;
