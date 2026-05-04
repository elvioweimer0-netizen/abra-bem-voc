
-- ============================================
-- TABLE: mystery_visit_criteria
-- ============================================
CREATE TABLE IF NOT EXISTS public.mystery_visit_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  ordem smallint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mystery_visit_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View criteria"
ON public.mystery_visit_criteria FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage criteria"
ON public.mystery_visit_criteria FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo))
WITH CHECK (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo));

-- Seed
INSERT INTO public.mystery_visit_criteria (code, name, ordem) VALUES
  ('atendimento', 'Atendimento da equipe', 1),
  ('limpeza_loja', 'Limpeza da loja', 2),
  ('organizacao_estoque', 'Organização do estoque/gôndolas', 3),
  ('fila_caixa', 'Tempo de fila no caixa', 4),
  ('qualidade_produto', 'Qualidade dos produtos', 5),
  ('sinalizacao_promo', 'Sinalização de promoções', 6),
  ('vestimenta_equipe', 'Vestimenta/uniforme da equipe', 7),
  ('postura_equipe', 'Postura e proatividade', 8)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- TABLE: mystery_visits
-- ============================================
CREATE TABLE IF NOT EXISTS public.mystery_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_unit_id uuid NOT NULL REFERENCES public.units(id),
  visit_date date NOT NULL,
  visit_time time NULL,
  anonymous_to_team boolean NOT NULL DEFAULT true,
  overall_score numeric(3,1) NULL CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 10)),
  notes text NULL,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mystery_visits_unit_date
  ON public.mystery_visits(target_unit_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_mystery_visits_visitor_date
  ON public.mystery_visits(visitor_user_id, visit_date DESC);

ALTER TABLE public.mystery_visits ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_mystery_visits_updated_at
BEFORE UPDATE ON public.mystery_visits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Insert mystery visit"
ON public.mystery_visits FOR INSERT TO authenticated
WITH CHECK (
  visitor_user_id = public.coverage_profile_id_for(auth.uid())
  AND (
    has_role(auth.uid(), 'gerente_loja'::cargo_tipo)
    OR has_role(auth.uid(), 'gerente_adm'::cargo_tipo)
    OR has_role(auth.uid(), 'gerente'::cargo_tipo)
    OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
    OR has_role(auth.uid(), 'admin'::cargo_tipo)
    OR has_role(auth.uid(), 'master'::cargo_tipo)
  )
);

CREATE POLICY "View mystery visit"
ON public.mystery_visits FOR SELECT TO authenticated
USING (
  visitor_user_id = public.coverage_profile_id_for(auth.uid())
  OR has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
);

CREATE POLICY "Update own mystery visit"
ON public.mystery_visits FOR UPDATE TO authenticated
USING (
  visitor_user_id = public.coverage_profile_id_for(auth.uid())
  OR has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
)
WITH CHECK (
  visitor_user_id = public.coverage_profile_id_for(auth.uid())
  OR has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
);

CREATE POLICY "Admins delete mystery visit"
ON public.mystery_visits FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
);

-- ============================================
-- TABLE: mystery_visit_scores
-- ============================================
CREATE TABLE IF NOT EXISTS public.mystery_visit_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES public.mystery_visits(id) ON DELETE CASCADE,
  criteria_id uuid NOT NULL REFERENCES public.mystery_visit_criteria(id),
  score smallint NOT NULL CHECK (score >= 1 AND score <= 5),
  comment text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (visit_id, criteria_id)
);

CREATE INDEX IF NOT EXISTS idx_mvs_visit ON public.mystery_visit_scores(visit_id);
CREATE INDEX IF NOT EXISTS idx_mvs_criteria ON public.mystery_visit_scores(criteria_id);

ALTER TABLE public.mystery_visit_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View scores via visit"
ON public.mystery_visit_scores FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mystery_visits v
    WHERE v.id = mystery_visit_scores.visit_id
      AND (
        v.visitor_user_id = public.coverage_profile_id_for(auth.uid())
        OR has_role(auth.uid(), 'admin'::cargo_tipo)
        OR has_role(auth.uid(), 'master'::cargo_tipo)
        OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
      )
  )
);

CREATE POLICY "Insert scores via visit"
ON public.mystery_visit_scores FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.mystery_visits v
    WHERE v.id = mystery_visit_scores.visit_id
      AND (
        v.visitor_user_id = public.coverage_profile_id_for(auth.uid())
        OR has_role(auth.uid(), 'admin'::cargo_tipo)
        OR has_role(auth.uid(), 'master'::cargo_tipo)
      )
  )
);

CREATE POLICY "Update scores via visit"
ON public.mystery_visit_scores FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mystery_visits v
    WHERE v.id = mystery_visit_scores.visit_id
      AND (
        v.visitor_user_id = public.coverage_profile_id_for(auth.uid())
        OR has_role(auth.uid(), 'admin'::cargo_tipo)
        OR has_role(auth.uid(), 'master'::cargo_tipo)
      )
  )
);

CREATE POLICY "Delete scores via visit"
ON public.mystery_visit_scores FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mystery_visits v
    WHERE v.id = mystery_visit_scores.visit_id
      AND (
        v.visitor_user_id = public.coverage_profile_id_for(auth.uid())
        OR has_role(auth.uid(), 'admin'::cargo_tipo)
        OR has_role(auth.uid(), 'master'::cargo_tipo)
      )
  )
);

-- ============================================
-- TRIGGER: recalculate overall score
-- ============================================
CREATE OR REPLACE FUNCTION public.tg_mvs_recalc_overall()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _visit_id uuid;
  _avg numeric;
BEGIN
  _visit_id := COALESCE(NEW.visit_id, OLD.visit_id);
  SELECT avg(score)::numeric INTO _avg
    FROM public.mystery_visit_scores
   WHERE visit_id = _visit_id;
  UPDATE public.mystery_visits
     SET overall_score = CASE WHEN _avg IS NULL THEN NULL ELSE round(_avg * 2, 1) END
   WHERE id = _visit_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER tg_mvs_recalc_ins
AFTER INSERT ON public.mystery_visit_scores
FOR EACH ROW EXECUTE FUNCTION public.tg_mvs_recalc_overall();

CREATE TRIGGER tg_mvs_recalc_upd
AFTER UPDATE ON public.mystery_visit_scores
FOR EACH ROW EXECUTE FUNCTION public.tg_mvs_recalc_overall();

CREATE TRIGGER tg_mvs_recalc_del
AFTER DELETE ON public.mystery_visit_scores
FOR EACH ROW EXECUTE FUNCTION public.tg_mvs_recalc_overall();

-- ============================================
-- TRIGGER: notify on overall_score finalized
-- ============================================
CREATE OR REPLACE FUNCTION public.tg_mystery_visit_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _unit_code text;
  _score_text text;
  r record;
BEGIN
  IF NEW.overall_score IS NULL OR (OLD.overall_score IS NOT NULL AND OLD.overall_score = NEW.overall_score) THEN
    RETURN NEW;
  END IF;

  SELECT code INTO _unit_code FROM public.units WHERE id = NEW.target_unit_id;
  _score_text := to_char(NEW.overall_score, 'FM9.0');

  -- Notify target unit managers ONLY when not anonymous
  IF NEW.anonymous_to_team = false THEN
    FOR r IN
      SELECT DISTINCT p.user_id
        FROM public.profiles p
       WHERE p.ativo = true
         AND p.user_id IS NOT NULL
         AND (p.unit_id = NEW.target_unit_id OR NEW.target_unit_id = ANY(p.permission_units))
         AND p.cargo IN ('gerente_loja'::cargo_tipo, 'gerente'::cargo_tipo, 'gerente_adm'::cargo_tipo)
    LOOP
      INSERT INTO public.notification_events
        (type, recipient_user_id, unit_id, title, body, payload, grouping_key)
      VALUES (
        'high_occurrence'::notification_event_type,
        r.user_id,
        NEW.target_unit_id,
        'Sua loja foi visitada',
        'Cliente Misterioso avaliou ' || COALESCE(_unit_code, 'sua loja') || ' com nota ' || _score_text || '/10.',
        jsonb_build_object('mystery_visit_id', NEW.id, 'score', NEW.overall_score),
        'mystery_visit_target:' || NEW.id::text
      );
    END LOOP;
  END IF;

  -- Critical low score (<6): notify supervisors/admins/master + Roberto/Guga
  IF NEW.overall_score < 6 THEN
    FOR r IN
      SELECT DISTINCT p.user_id
        FROM public.profiles p
       WHERE p.ativo = true
         AND p.user_id IS NOT NULL
         AND (
           p.cargo IN ('admin'::cargo_tipo, 'master'::cargo_tipo, 'supervisor'::cargo_tipo)
           OR lower(p.nome) LIKE '%roberto%'
           OR lower(p.nome) LIKE '%guga%'
         )
    LOOP
      INSERT INTO public.notification_events
        (type, recipient_user_id, unit_id, title, body, payload, grouping_key)
      VALUES (
        'high_occurrence'::notification_event_type,
        r.user_id,
        NEW.target_unit_id,
        '⚠️ Score crítico no Cliente Misterioso',
        COALESCE(_unit_code, 'Loja') || ' recebeu nota ' || _score_text || '/10.',
        jsonb_build_object('mystery_visit_id', NEW.id, 'score', NEW.overall_score, 'unit_id', NEW.target_unit_id),
        'mystery_visit_critical:' || NEW.id::text || ':' || r.user_id::text
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_mystery_visit_notify
AFTER UPDATE ON public.mystery_visits
FOR EACH ROW EXECUTE FUNCTION public.tg_mystery_visit_notify();

-- ============================================
-- STORAGE BUCKET (private)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('mystery-photos', 'mystery-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Mystery photos view"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'mystery-photos'
  AND (
    has_role(auth.uid(), 'admin'::cargo_tipo)
    OR has_role(auth.uid(), 'master'::cargo_tipo)
    OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
    OR EXISTS (
      SELECT 1 FROM public.mystery_visits v
      WHERE v.id::text = (storage.foldername(name))[1]
        AND v.visitor_user_id = public.coverage_profile_id_for(auth.uid())
    )
  )
);

CREATE POLICY "Mystery photos upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'mystery-photos'
  AND (
    has_role(auth.uid(), 'gerente_loja'::cargo_tipo)
    OR has_role(auth.uid(), 'gerente_adm'::cargo_tipo)
    OR has_role(auth.uid(), 'gerente'::cargo_tipo)
    OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
    OR has_role(auth.uid(), 'admin'::cargo_tipo)
    OR has_role(auth.uid(), 'master'::cargo_tipo)
  )
);

CREATE POLICY "Mystery photos delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'mystery-photos'
  AND (
    has_role(auth.uid(), 'admin'::cargo_tipo)
    OR has_role(auth.uid(), 'master'::cargo_tipo)
    OR EXISTS (
      SELECT 1 FROM public.mystery_visits v
      WHERE v.id::text = (storage.foldername(name))[1]
        AND v.visitor_user_id = public.coverage_profile_id_for(auth.uid())
    )
  )
);
