-- Manager Score system
CREATE TABLE public.manager_score_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  weight numeric(5,2) NOT NULL CHECK (weight >= 0 AND weight <= 100),
  metric_query_name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  ordem smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER tg_msd_updated_at BEFORE UPDATE ON public.manager_score_dimensions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.manager_score_dimensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Score dims viewable by leadership" ON public.manager_score_dimensions
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
    OR public.has_role(auth.uid(), 'gerente_loja'::cargo_tipo)
    OR public.has_role(auth.uid(), 'gerente_adm'::cargo_tipo)
    OR public.has_role(auth.uid(), 'encarregado'::cargo_tipo)
  );

CREATE POLICY "Score dims mutate by admin" ON public.manager_score_dimensions
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  ) WITH CHECK (
    public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  );

-- Seed
INSERT INTO public.manager_score_dimensions (code, name, description, weight, metric_query_name, ordem) VALUES
  ('disciplina_operacional', 'Disciplina Operacional', '% de checklists completos da unidade no mês', 18, 'checklist_completion_rate', 1),
  ('comunicacao', 'Comunicação', 'Leitura de avisos pelo gerente e pela equipe', 10, 'aviso_read_rate', 2),
  ('lideranca_ativa', 'Liderança Ativa', 'Daily huddles publicados / dias úteis', 12, 'daily_huddle_rate', 3),
  ('cumprimento_compromissos', 'Cumprimento de Compromissos', 'Weekly commitments cumpridos no mês', 15, 'commitments_fulfillment', 4),
  ('cultura', 'Cultura', 'Curiós de Ouro dados pelo gerente + recebidos pela equipe', 10, 'praises_normalized', 5),
  ('disciplina_disciplinar', 'Disciplina Disciplinar', '100 - advertências da unidade no mês (penalidade)', 10, 'advertencia_inverse', 6),
  ('engajamento_equipe', 'Engajamento da Equipe', 'Mood médio da unidade x 20', 15, 'mood_average', 7),
  ('desenvolvimento', 'Desenvolvimento', '% cápsulas concluídas pelo gerente + média da equipe', 10, 'training_completion', 8);

CREATE TABLE public.manager_scores_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  year smallint NOT NULL,
  month smallint NOT NULL CHECK (month BETWEEN 1 AND 12),
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  final_score numeric(5,2) NOT NULL CHECK (final_score >= 0 AND final_score <= 100),
  dimension_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  UNIQUE (user_id, year, month)
);

CREATE INDEX idx_msm_year_month_score ON public.manager_scores_monthly (year, month, final_score DESC);
CREATE INDEX idx_msm_unit_year_month ON public.manager_scores_monthly (unit_id, year DESC, month DESC);
CREATE INDEX idx_msm_user_year_month ON public.manager_scores_monthly (user_id, year DESC, month DESC);

ALTER TABLE public.manager_scores_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scores own or leadership view" ON public.manager_scores_monthly
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
  );
-- No INSERT/UPDATE/DELETE policy => clients can't write. Edge function uses service role.