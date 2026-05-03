
-- ============ TABLES ============
CREATE TABLE public.leadership_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date date UNIQUE NOT NULL,
  question_text text NOT NULL CHECK (char_length(question_text) BETWEEN 20 AND 500),
  context_note text,
  target_roles text[] NOT NULL DEFAULT '{master,admin,supervisor,gerente_loja,gerente_adm}',
  deadline_date date NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.leadership_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.leadership_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  answer_text text NOT NULL CHECK (char_length(answer_text) BETWEEN 50 AND 2000),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  UNIQUE (question_id, user_id)
);
CREATE INDEX idx_leadership_answers_question ON public.leadership_answers(question_id);
CREATE INDEX idx_leadership_answers_user ON public.leadership_answers(user_id);

CREATE TABLE public.leadership_answer_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id uuid NOT NULL REFERENCES public.leadership_answers(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL,
  comment_text text NOT NULL CHECK (char_length(comment_text) BETWEEN 5 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_leadership_answer_comments_answer ON public.leadership_answer_comments(answer_id, created_at DESC);

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION public.is_eligible_for_leadership_question(_uid uuid, _question_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.leadership_questions q
    JOIN public.profiles p ON p.user_id = _uid
    WHERE q.id = _question_id
      AND p.cargo::text = ANY(q.target_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.user_already_answered_question(_uid uuid, _question_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.leadership_answers a
    WHERE a.question_id = _question_id AND a.user_id = _uid
  )
$$;

CREATE OR REPLACE FUNCTION public.question_deadline_passed(_question_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.leadership_questions q
    WHERE q.id = _question_id AND (q.deadline_date + interval '1 day') <= now()
  )
$$;

CREATE OR REPLACE FUNCTION public.can_view_leadership_answer(_uid uuid, _answer_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.leadership_answers a
    WHERE a.id = _answer_id
      AND (
        a.user_id = _uid
        OR public.has_role(_uid, 'admin'::cargo_tipo)
        OR public.has_role(_uid, 'master'::cargo_tipo)
        OR public.has_role(_uid, 'supervisor'::cargo_tipo)
        OR (
          public.is_eligible_for_leadership_question(_uid, a.question_id)
          AND public.user_already_answered_question(_uid, a.question_id)
        )
      )
  )
$$;

-- ============ RLS ============
ALTER TABLE public.leadership_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadership_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadership_answer_comments ENABLE ROW LEVEL SECURITY;

-- questions
CREATE POLICY "View questions if eligible or admin" ON public.leadership_questions
FOR SELECT TO authenticated USING (
  public.is_eligible_for_leadership_question(auth.uid(), id)
  OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
);
CREATE POLICY "Admins create questions" ON public.leadership_questions
FOR INSERT TO authenticated WITH CHECK (
  (created_by = auth.uid()) AND (
    public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
  )
);
CREATE POLICY "Admins update questions" ON public.leadership_questions
FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
) WITH CHECK (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
);
CREATE POLICY "Admins delete questions" ON public.leadership_questions
FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
);

-- answers
CREATE POLICY "Insert own answer if eligible" ON public.leadership_answers
FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND public.is_eligible_for_leadership_question(auth.uid(), question_id)
);
CREATE POLICY "View answers anti-contagion" ON public.leadership_answers
FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR (
    public.is_eligible_for_leadership_question(auth.uid(), question_id)
    AND public.user_already_answered_question(auth.uid(), question_id)
  )
);
CREATE POLICY "Edit own answer until deadline" ON public.leadership_answers
FOR UPDATE TO authenticated USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.leadership_questions q
    WHERE q.id = question_id AND (q.deadline_date + interval '1 day') > now()
  )
) WITH CHECK (user_id = auth.uid());
-- DELETE intentionally not granted

-- comments
CREATE POLICY "View comments if can view answer" ON public.leadership_answer_comments
FOR SELECT TO authenticated USING (public.can_view_leadership_answer(auth.uid(), answer_id));

CREATE POLICY "Insert comment after deadline" ON public.leadership_answer_comments
FOR INSERT TO authenticated WITH CHECK (
  author_user_id = auth.uid()
  AND public.can_view_leadership_answer(auth.uid(), answer_id)
  AND EXISTS (
    SELECT 1 FROM public.leadership_answers a
    WHERE a.id = answer_id AND public.question_deadline_passed(a.question_id)
  )
);

CREATE POLICY "Delete own comment or admin" ON public.leadership_answer_comments
FOR DELETE TO authenticated USING (
  author_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
);
