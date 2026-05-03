
CREATE OR REPLACE FUNCTION public.fn_heatmap_indicators(_period text DEFAULT 'mes')
RETURNS TABLE (
  unit_id uuid,
  total_advertencias int,
  total_ocorrencias int,
  total_suspensoes int,
  total_checklist_atrasados int,
  total_faltas_setor int,
  total_vagas_abertas int,
  mood_baixo_count int,
  avisos_pendentes int
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _from timestamptz;
BEGIN
  _from := CASE lower(_period)
    WHEN 'hoje'      THEN date_trunc('day', now())
    WHEN 'semana'    THEN now() - interval '7 days'
    WHEN 'trimestre' THEN now() - interval '90 days'
    ELSE                  date_trunc('month', now())
  END;

  RETURN QUERY
  WITH base AS (
    SELECT u.id AS unit_id, u.code AS unit_code FROM public.units u
  ),
  adv AS (
    SELECT b.unit_id, COALESCE(count(a.id), 0)::int AS n
    FROM base b
    LEFT JOIN public.advertencias a
      ON to_regclass('public.advertencias') IS NOT NULL
     AND a.created_at >= _from
     AND a.unidade::text = b.unit_code
    GROUP BY b.unit_id
  ),
  occ AS (
    SELECT b.unit_id, COALESCE(count(o.id), 0)::int AS n
    FROM base b
    LEFT JOIN public.leadership_occurrences o
      ON to_regclass('public.leadership_occurrences') IS NOT NULL
     AND o.created_at >= _from
     AND o.unit_id = b.unit_id
    GROUP BY b.unit_id
  ),
  susp AS (
    SELECT b.unit_id, COALESCE(count(s.id), 0)::int AS n
    FROM base b
    LEFT JOIN public.suspensoes s
      ON to_regclass('public.suspensoes') IS NOT NULL
     AND s.created_at >= _from
     AND s.unidade::text = b.unit_code
    GROUP BY b.unit_id
  ),
  chk AS (
    SELECT b.unit_id,
      GREATEST(
        COALESCE((
          SELECT count(*) FROM public.checklist_templates t
          WHERE to_regclass('public.checklist_templates') IS NOT NULL AND t.active = true
        ), 0)
        - COALESCE((
          SELECT count(*) FROM public.checklist_completions c
          WHERE to_regclass('public.checklist_completions') IS NOT NULL
            AND c.unit_id = b.unit_id
            AND c.data = CURRENT_DATE
            AND c.status = 'completo'::checklist_status
        ), 0),
        0
      )::int AS n
    FROM base b
  ),
  fal AS (
    SELECT b.unit_id, COALESCE(count(ar.id), 0)::int AS n
    FROM base b
    LEFT JOIN public.attendance_records ar
      ON to_regclass('public.attendance_records') IS NOT NULL
     AND ar.marked_at >= _from
     AND ar.status = 'falta'::attendance_status
    LEFT JOIN public.team_members tm ON tm.id = ar.team_member_id AND tm.unit_id = b.unit_id
    WHERE ar.id IS NULL OR tm.unit_id = b.unit_id
    GROUP BY b.unit_id
  ),
  vag AS (
    SELECT b.unit_id, COALESCE(count(tm.id), 0)::int AS n
    FROM base b
    LEFT JOIN public.team_members tm
      ON to_regclass('public.team_members') IS NOT NULL
     AND tm.unit_id = b.unit_id
     AND tm.user_id IS NULL
    GROUP BY b.unit_id
  ),
  moo AS (
    SELECT b.unit_id, COALESCE(count(dm.id), 0)::int AS n
    FROM base b
    LEFT JOIN public.daily_mood dm
      ON to_regclass('public.daily_mood') IS NOT NULL
     AND dm.unit_id = b.unit_id
     AND dm.recorded_at >= now() - interval '7 days'
     AND dm.score < 3
    GROUP BY b.unit_id
  ),
  avi AS (
    SELECT b.unit_id,
      COALESCE((
        SELECT count(*) FROM public.avisos a
        WHERE to_regclass('public.avisos') IS NOT NULL
          AND a.ativo = true
          AND a.urgente = true
          AND (a.unidade IS NULL OR a.unidade::text = b.unit_code)
          AND NOT EXISTS (
            SELECT 1 FROM public.aviso_reads r WHERE r.aviso_id = a.id
          )
      ), 0)::int AS n
    FROM base b
  )
  SELECT b.unit_id,
         adv.n, occ.n, susp.n, chk.n, fal.n, vag.n, moo.n, avi.n
  FROM base b
  LEFT JOIN adv USING (unit_id)
  LEFT JOIN occ USING (unit_id)
  LEFT JOIN susp USING (unit_id)
  LEFT JOIN chk USING (unit_id)
  LEFT JOIN fal USING (unit_id)
  LEFT JOIN vag USING (unit_id)
  LEFT JOIN moo USING (unit_id)
  LEFT JOIN avi USING (unit_id);
EXCEPTION WHEN OTHERS THEN
  -- graceful: retornar zeros
  RETURN QUERY
  SELECT u.id, 0, 0, 0, 0, 0, 0, 0, 0 FROM public.units u;
END;
$$;

CREATE OR REPLACE VIEW public.v_heatmap_indicators
WITH (security_invoker = on) AS
SELECT * FROM public.fn_heatmap_indicators('mes');

GRANT EXECUTE ON FUNCTION public.fn_heatmap_indicators(text) TO authenticated;
GRANT SELECT ON public.v_heatmap_indicators TO authenticated;
