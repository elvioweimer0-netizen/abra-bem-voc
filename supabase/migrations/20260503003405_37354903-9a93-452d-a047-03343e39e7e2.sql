
CREATE OR REPLACE FUNCTION public.can_view_climate(_user_id uuid, _unit_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::cargo_tipo)
      OR public.has_role(_user_id, 'master'::cargo_tipo)
      OR public.has_role(_user_id, 'supervisor'::cargo_tipo)
      OR public.has_role(_user_id, 'gerente_adm'::cargo_tipo)
      OR public.is_unit_manager(_user_id, _unit_id)
$$;

CREATE TABLE public.daily_mood (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  score smallint CHECK (score IS NULL OR (score BETWEEN 1 AND 5)),
  skipped boolean NOT NULL DEFAULT false,
  note text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  recorded_date date GENERATED ALWAYS AS (((recorded_at AT TIME ZONE 'UTC')::date)) STORED
);
CREATE UNIQUE INDEX daily_mood_user_day_unique ON public.daily_mood (user_id, recorded_date);
CREATE INDEX daily_mood_unit_recorded_idx ON public.daily_mood (unit_id, recorded_at);

ALTER TABLE public.daily_mood ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own mood" ON public.daily_mood FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users view own mood" ON public.daily_mood FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users delete own mood" ON public.daily_mood FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.pulse_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date date NOT NULL UNIQUE,
  question_text text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
ALTER TABLE public.pulse_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authed view pulse questions" ON public.pulse_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert pulse questions" ON public.pulse_questions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::cargo_tipo) OR has_role(auth.uid(),'master'::cargo_tipo));
CREATE POLICY "Admins update pulse questions" ON public.pulse_questions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::cargo_tipo) OR has_role(auth.uid(),'master'::cargo_tipo))
  WITH CHECK (has_role(auth.uid(),'admin'::cargo_tipo) OR has_role(auth.uid(),'master'::cargo_tipo));
CREATE POLICY "Admins delete pulse questions" ON public.pulse_questions FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::cargo_tipo) OR has_role(auth.uid(),'master'::cargo_tipo));

CREATE TABLE public.pulse_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.pulse_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  answer_text text NOT NULL CHECK (char_length(answer_text) <= 500),
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, user_id)
);
CREATE INDEX pulse_answers_unit_idx ON public.pulse_answers (unit_id, answered_at);
ALTER TABLE public.pulse_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own pulse answer" ON public.pulse_answers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users view own pulse answer" ON public.pulse_answers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE VIEW public.v_mood_aggregate
WITH (security_invoker = off) AS
SELECT
  m.unit_id,
  p.setor::text AS setor,
  m.recorded_date AS day,
  AVG(m.score)::numeric(4,2) AS avg_score,
  COUNT(*) FILTER (WHERE m.skipped = false) AS responses,
  COUNT(*) FILTER (WHERE m.skipped = true) AS skips
FROM public.daily_mood m
LEFT JOIN public.profiles p ON p.user_id = m.user_id
WHERE m.skipped = false
  AND public.can_view_climate(auth.uid(), m.unit_id)
GROUP BY m.unit_id, p.setor, m.recorded_date;

CREATE OR REPLACE VIEW public.v_pulse_aggregate
WITH (security_invoker = off) AS
SELECT
  q.id AS question_id,
  q.week_start_date,
  q.question_text,
  a.unit_id,
  a.answer_text,
  a.answered_at
FROM public.pulse_answers a
JOIN public.pulse_questions q ON q.id = a.question_id
WHERE public.can_view_climate(auth.uid(), a.unit_id);

GRANT SELECT ON public.v_mood_aggregate TO authenticated;
GRANT SELECT ON public.v_pulse_aggregate TO authenticated;
