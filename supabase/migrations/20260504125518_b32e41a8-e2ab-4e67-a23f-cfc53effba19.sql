-- ============================================
-- CUSTOMER COMPLAINTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.customer_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registered_by_user_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id),
  category text NOT NULL CHECK (category IN ('atendimento','produto','preco','fila','limpeza','estoque','outros')),
  severity text NOT NULL CHECK (severity IN ('leve','media','grave','muito_grave')),
  description text NOT NULL,
  customer_contact text NULL,
  action_taken text NULL,
  setor text NULL,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','em_andamento','resolvida')),
  resolved_at timestamptz NULL,
  resolved_by_user_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_complaints_unit_created
  ON public.customer_complaints(unit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_status_severity
  ON public.customer_complaints(status, severity);
CREATE INDEX IF NOT EXISTS idx_complaints_category_setor
  ON public.customer_complaints(category, setor, created_at);

ALTER TABLE public.customer_complaints ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_customer_complaints_updated_at
BEFORE UPDATE ON public.customer_complaints
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Insert complaints for accessible unit"
ON public.customer_complaints FOR INSERT TO authenticated
WITH CHECK (
  registered_by_user_id = public.coverage_profile_id_for(auth.uid())
  AND public.user_can_access_unit(auth.uid(), unit_id)
);

CREATE POLICY "View complaints"
ON public.customer_complaints FOR SELECT TO authenticated
USING (
  registered_by_user_id = public.coverage_profile_id_for(auth.uid())
  OR public.user_can_access_unit(auth.uid(), unit_id)
  OR has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR has_role(auth.uid(), 'gerente_adm'::cargo_tipo)
);

CREATE POLICY "Managers update complaints"
ON public.customer_complaints FOR UPDATE TO authenticated
USING (
  (
    public.user_can_access_unit(auth.uid(), unit_id)
    AND (
      has_role(auth.uid(), 'gerente_loja'::cargo_tipo)
      OR has_role(auth.uid(), 'gerente'::cargo_tipo)
      OR has_role(auth.uid(), 'encarregado'::cargo_tipo)
    )
  )
  OR has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
)
WITH CHECK (
  (
    public.user_can_access_unit(auth.uid(), unit_id)
    AND (
      has_role(auth.uid(), 'gerente_loja'::cargo_tipo)
      OR has_role(auth.uid(), 'gerente'::cargo_tipo)
      OR has_role(auth.uid(), 'encarregado'::cargo_tipo)
    )
  )
  OR has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
);

CREATE POLICY "Admins delete complaints"
ON public.customer_complaints FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION public.tg_complaint_autofill_resolution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'resolvida' AND (OLD.status IS DISTINCT FROM 'resolvida') THEN
    IF NEW.resolved_at IS NULL THEN NEW.resolved_at := now(); END IF;
    IF NEW.resolved_by_user_id IS NULL THEN
      NEW.resolved_by_user_id := public.coverage_profile_id_for(auth.uid());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_complaint_autofill_resolution
BEFORE UPDATE ON public.customer_complaints
FOR EACH ROW EXECUTE FUNCTION public.tg_complaint_autofill_resolution();

CREATE OR REPLACE FUNCTION public.tg_complaint_severity_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _unit_code text;
  _category_label text;
  _severity_label text;
  r record;
BEGIN
  IF NEW.severity NOT IN ('grave','muito_grave') THEN RETURN NEW; END IF;

  SELECT code INTO _unit_code FROM public.units WHERE id = NEW.unit_id;
  _category_label := initcap(replace(NEW.category, '_', ' '));
  _severity_label := CASE NEW.severity WHEN 'grave' THEN 'grave' ELSE 'muito grave' END;

  FOR r IN
    SELECT DISTINCT p.user_id
      FROM public.profiles p
     WHERE p.ativo = true
       AND (p.unit_id = NEW.unit_id OR NEW.unit_id = ANY(p.permission_units))
       AND p.cargo IN ('gerente_loja'::cargo_tipo,'gerente'::cargo_tipo,'encarregado'::cargo_tipo)
  LOOP
    INSERT INTO public.notification_events
      (type, recipient_user_id, unit_id, title, body, payload, grouping_key)
    VALUES (
      'high_occurrence'::notification_event_type,
      r.user_id,
      NEW.unit_id,
      'Reclamação ' || _severity_label || ' registrada',
      'Categoria: ' || _category_label || COALESCE(' • ' || _unit_code, '') ||
        ' — ' || left(NEW.description, 140),
      jsonb_build_object(
        'complaint_id', NEW.id,
        'category', NEW.category,
        'severity', NEW.severity,
        'unit_id', NEW.unit_id
      ),
      'complaint:' || NEW.id::text
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_complaint_severity_notify
AFTER INSERT ON public.customer_complaints
FOR EACH ROW EXECUTE FUNCTION public.tg_complaint_severity_notify();

CREATE OR REPLACE FUNCTION public.tg_complaint_pattern_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count int;
  _unit_code text;
  r record;
BEGIN
  SELECT count(*) INTO _count
    FROM public.customer_complaints c
   WHERE c.unit_id = NEW.unit_id
     AND c.category = NEW.category
     AND (
       (NEW.setor IS NULL AND c.setor IS NULL)
       OR (NEW.setor IS NOT NULL AND c.setor = NEW.setor)
     )
     AND c.created_at >= now() - interval '30 days';

  IF _count < 3 THEN RETURN NEW; END IF;

  SELECT code INTO _unit_code FROM public.units WHERE id = NEW.unit_id;

  FOR r IN
    SELECT DISTINCT p.user_id
      FROM public.profiles p
     WHERE p.ativo = true
       AND (
         p.gerencia IN ('RECURSOS_HUMANOS'::gerencia_tipo,'DEPARTAMENTO_PESSOAL'::gerencia_tipo)
         OR p.cargo IN ('admin'::cargo_tipo,'master'::cargo_tipo,'supervisor'::cargo_tipo)
       )
  LOOP
    INSERT INTO public.notification_events
      (type, recipient_user_id, unit_id, title, body, payload, grouping_key)
    VALUES (
      'high_occurrence'::notification_event_type,
      r.user_id,
      NEW.unit_id,
      'Padrão de reclamações detectado',
      _count || ' reclamações de "' || NEW.category || '"' ||
        COALESCE(' no setor ' || NEW.setor, '') ||
        COALESCE(' em ' || _unit_code, '') ||
        ' nos últimos 30 dias.',
      jsonb_build_object(
        'unit_id', NEW.unit_id,
        'category', NEW.category,
        'setor', NEW.setor,
        'count_30d', _count
      ),
      'complaint_pattern:' || NEW.unit_id::text || ':' || NEW.category ||
        COALESCE(':' || NEW.setor, '') || ':' || to_char(now(), 'YYYY-MM-DD')
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_complaint_pattern_notify
AFTER INSERT ON public.customer_complaints
FOR EACH ROW EXECUTE FUNCTION public.tg_complaint_pattern_notify();

-- ============================================
-- HEATMAP: drop view + function (cascade-safe), recreate with total_complaints
-- ============================================

DROP VIEW IF EXISTS public.v_heatmap_indicators;
DROP FUNCTION IF EXISTS public.fn_heatmap_indicators(text);

CREATE OR REPLACE FUNCTION public.fn_heatmap_indicators(_period text DEFAULT 'mes'::text)
 RETURNS TABLE(
   unit_id uuid,
   total_advertencias integer,
   total_ocorrencias integer,
   total_suspensoes integer,
   total_checklist_atrasados integer,
   total_faltas_setor integer,
   total_vagas_abertas integer,
   mood_baixo_count integer,
   avisos_pendentes integer,
   total_complaints integer
 )
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
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
  ),
  comp AS (
    SELECT b.unit_id, COALESCE(count(c.id), 0)::int AS n
    FROM base b
    LEFT JOIN public.customer_complaints c
      ON to_regclass('public.customer_complaints') IS NOT NULL
     AND c.unit_id = b.unit_id
     AND c.created_at >= _from
     AND c.status <> 'resolvida'
    GROUP BY b.unit_id
  )
  SELECT b.unit_id,
         adv.n, occ.n, susp.n, chk.n, fal.n, vag.n, moo.n, avi.n, comp.n
  FROM base b
  LEFT JOIN adv USING (unit_id)
  LEFT JOIN occ USING (unit_id)
  LEFT JOIN susp USING (unit_id)
  LEFT JOIN chk USING (unit_id)
  LEFT JOIN fal USING (unit_id)
  LEFT JOIN vag USING (unit_id)
  LEFT JOIN moo USING (unit_id)
  LEFT JOIN avi USING (unit_id)
  LEFT JOIN comp USING (unit_id);
END;
$function$;

CREATE OR REPLACE VIEW public.v_heatmap_indicators
WITH (security_invoker='on') AS
SELECT * FROM public.fn_heatmap_indicators('mes'::text);