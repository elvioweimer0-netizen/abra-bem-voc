
-- Tabela milestone_celebrations
CREATE TABLE public.milestone_celebrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  milestone_type text NOT NULL CHECK (milestone_type IN ('1_year','3_years','5_years','10_years','20_years','promotion','first_day')),
  milestone_date date NOT NULL,
  celebrated_at timestamptz NOT NULL DEFAULT now(),
  praise_id uuid REFERENCES public.praises(id) ON DELETE SET NULL,
  post_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, milestone_type, milestone_date)
);

CREATE INDEX idx_milestone_celebrations_date ON public.milestone_celebrations(milestone_date DESC);
CREATE INDEX idx_milestone_celebrations_user ON public.milestone_celebrations(user_id);

ALTER TABLE public.milestone_celebrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view milestones"
ON public.milestone_celebrations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage milestones"
ON public.milestone_celebrations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::cargo_tipo) OR public.has_role(auth.uid(), 'master'::cargo_tipo))
WITH CHECK (public.has_role(auth.uid(), 'admin'::cargo_tipo) OR public.has_role(auth.uid(), 'master'::cargo_tipo));

-- Adicionar valor 'aniversario_curio' ao enum praise_category
ALTER TYPE public.praise_category ADD VALUE IF NOT EXISTS 'aniversario_curio';

-- Seed de achievements veteranos (1, 3, 10, 20 — 5y já existe)
INSERT INTO public.achievements (code, name, description, icon, category, criteria_type, criteria_metric, criteria_target, ordem)
VALUES
  ('veterano_1y', 'Primeiro Ano Curió', 'Completou 1 ano no Curió', '🎉', 'tempo_curio', 'date_based', 'years_at_curio', 1, 91),
  ('veterano_3y', 'Veterano Bronze', 'Completou 3 anos no Curió', '🥉', 'tempo_curio', 'date_based', 'years_at_curio', 3, 92),
  ('veterano_10y', 'Veterano Ouro', 'Completou 10 anos no Curió', '🥇', 'tempo_curio', 'date_based', 'years_at_curio', 10, 94),
  ('veterano_20y', 'Lenda Curió', 'Completou 20 anos no Curió', '💎', 'tempo_curio', 'date_based', 'years_at_curio', 20, 95)
ON CONFLICT (code) DO NOTHING;
