
-- Enum
CREATE TYPE public.training_category AS ENUM (
  'atendimento','flv','padaria','acougue',
  'seguranca_alimentar','codigo_etica','outros'
);

-- training_modules
CREATE TABLE public.training_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  video_url text NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0,
  category public.training_category NOT NULL DEFAULT 'outros',
  thumbnail_url text,
  ordem integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_training_modules_active_cat ON public.training_modules(active, category, ordem);
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_training_modules_updated
BEFORE UPDATE ON public.training_modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- quiz_questions
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_index smallint NOT NULL CHECK (correct_index >= 0),
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(options) = 'array'),
  CHECK (jsonb_array_length(options) BETWEEN 2 AND 6),
  CHECK (correct_index < jsonb_array_length(options))
);
CREATE INDEX idx_quiz_questions_module ON public.quiz_questions(module_id, ordem);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- training_attempts
CREATE TABLE public.training_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  score numeric(5,2) NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  passed boolean GENERATED ALWAYS AS (score >= 70) STORED
);
CREATE INDEX idx_training_attempts_user_mod ON public.training_attempts(user_id, module_id, attempted_at DESC);
ALTER TABLE public.training_attempts ENABLE ROW LEVEL SECURITY;

-- training_completions
CREATE TABLE public.training_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  score numeric(5,2) NOT NULL,
  unit_id uuid,
  UNIQUE (user_id, module_id)
);
CREATE INDEX idx_training_completions_user ON public.training_completions(user_id);
CREATE INDEX idx_training_completions_unit ON public.training_completions(unit_id);
ALTER TABLE public.training_completions ENABLE ROW LEVEL SECURITY;

-- Trigger: validar score >= 70 e snapshot unit_id
CREATE OR REPLACE FUNCTION public.validate_training_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.score < 70 THEN
    RAISE EXCEPTION 'Score mínimo para completion é 70%%, recebido %', NEW.score;
  END IF;
  IF NEW.unit_id IS NULL THEN
    NEW.unit_id := (SELECT unit_id FROM public.profiles WHERE user_id = NEW.user_id);
  END IF;
  NEW.completed_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_training_completion
BEFORE INSERT OR UPDATE ON public.training_completions
FOR EACH ROW EXECUTE FUNCTION public.validate_training_completion();

-- occurrence_reason_modules (mapeamento motivo → módulo)
CREATE TABLE public.occurrence_reason_modules (
  reason_key text PRIMARY KEY,
  training_module_id uuid REFERENCES public.training_modules(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.occurrence_reason_modules ENABLE ROW LEVEL SECURITY;

-- Helper: is_rh_admin
CREATE OR REPLACE FUNCTION public.is_rh_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::cargo_tipo)
      OR public.has_role(_user_id, 'master'::cargo_tipo)
      OR (
        public.has_role(_user_id, 'gerente_adm'::cargo_tipo)
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = _user_id
            AND lower(coalesce(p.cargo_titulo,'') || ' ' || coalesce(p.descricao,'') || ' ' || coalesce(p.nome,''))
                LIKE '%recursos humanos%'
        )
      )
$$;

-- ============ RLS POLICIES ============

-- training_modules
CREATE POLICY "View training modules"
ON public.training_modules FOR SELECT TO authenticated
USING (active = true OR public.is_rh_admin(auth.uid()));

CREATE POLICY "RH manage training modules"
ON public.training_modules FOR ALL TO authenticated
USING (public.is_rh_admin(auth.uid()))
WITH CHECK (public.is_rh_admin(auth.uid()));

-- quiz_questions
CREATE POLICY "View quiz questions"
ON public.quiz_questions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.training_modules m
    WHERE m.id = quiz_questions.module_id
      AND (m.active = true OR public.is_rh_admin(auth.uid()))
  )
);

CREATE POLICY "RH manage quiz questions"
ON public.quiz_questions FOR ALL TO authenticated
USING (public.is_rh_admin(auth.uid()))
WITH CHECK (public.is_rh_admin(auth.uid()));

-- training_attempts
CREATE POLICY "Users insert own attempts"
ON public.training_attempts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "View attempts"
ON public.training_attempts FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_rh_admin(auth.uid()));

-- training_completions
CREATE POLICY "Users upsert own completions"
ON public.training_completions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own completions"
ON public.training_completions FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "View completions"
ON public.training_completions FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_rh_admin(auth.uid())
  OR (public.is_leadership(auth.uid()) AND unit_id IS NOT NULL AND public.user_can_access_unit(auth.uid(), unit_id))
);

-- occurrence_reason_modules
CREATE POLICY "View reason modules"
ON public.occurrence_reason_modules FOR SELECT TO authenticated
USING (true);

CREATE POLICY "RH manage reason modules"
ON public.occurrence_reason_modules FOR ALL TO authenticated
USING (public.is_rh_admin(auth.uid()))
WITH CHECK (public.is_rh_admin(auth.uid()));

-- ============ RPC submit_quiz ============
CREATE OR REPLACE FUNCTION public.submit_quiz(_module_id uuid, _answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total int := 0;
  correct int := 0;
  score numeric(5,2);
  q record;
  chosen int;
  uid uuid := auth.uid();
  attempt_id uuid;
  detail jsonb := '[]'::jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  FOR q IN SELECT id, correct_index FROM public.quiz_questions WHERE module_id = _module_id LOOP
    total := total + 1;
    chosen := NULLIF(_answers ->> q.id::text, '')::int;
    IF chosen IS NOT NULL AND chosen = q.correct_index THEN
      correct := correct + 1;
      detail := detail || jsonb_build_object('question_id', q.id, 'correct', true, 'chosen', chosen);
    ELSE
      detail := detail || jsonb_build_object('question_id', q.id, 'correct', false, 'chosen', chosen, 'expected', q.correct_index);
    END IF;
  END LOOP;

  IF total = 0 THEN
    RAISE EXCEPTION 'Módulo não tem perguntas';
  END IF;

  score := round((correct::numeric / total::numeric) * 100, 2);

  INSERT INTO public.training_attempts (user_id, module_id, score, answers)
  VALUES (uid, _module_id, score, _answers)
  RETURNING id INTO attempt_id;

  IF score >= 70 THEN
    INSERT INTO public.training_completions (user_id, module_id, score)
    VALUES (uid, _module_id, score)
    ON CONFLICT (user_id, module_id) DO UPDATE
      SET score = EXCLUDED.score,
          completed_at = now();
  END IF;

  RETURN jsonb_build_object(
    'attempt_id', attempt_id,
    'score', score,
    'correct', correct,
    'total', total,
    'passed', score >= 70,
    'detail', detail
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_quiz(uuid, jsonb) TO authenticated;
