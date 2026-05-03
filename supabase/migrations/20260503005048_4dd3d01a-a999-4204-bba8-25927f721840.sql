
CREATE OR REPLACE FUNCTION public.is_commitment_viewer(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::cargo_tipo)
      OR public.has_role(_user_id, 'master'::cargo_tipo)
      OR public.has_role(_user_id, 'supervisor'::cargo_tipo)
      OR public.has_role(_user_id, 'gerente'::cargo_tipo)
      OR public.has_role(_user_id, 'gerente_loja'::cargo_tipo)
      OR public.has_role(_user_id, 'gerente_adm'::cargo_tipo)
      OR public.has_role(_user_id, 'encarregado'::cargo_tipo)
      OR public.has_role(_user_id, 'fiscal'::cargo_tipo)
      OR public.has_role(_user_id, 'lider_setor'::cargo_tipo)
$$;

CREATE TABLE public.weekly_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  week_start_date date NOT NULL,
  commitment_text text NOT NULL CHECK (char_length(commitment_text) BETWEEN 10 AND 200),
  ordem smallint NOT NULL CHECK (ordem BETWEEN 1 AND 3),
  status text NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento','cumprido','parcial','nao_cumprido','cancelado')),
  evidencia text NOT NULL DEFAULT '',
  evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start_date, ordem)
);

CREATE INDEX idx_weekly_commitments_week_unit ON public.weekly_commitments (week_start_date DESC, unit_id);
CREATE INDEX idx_weekly_commitments_user_week ON public.weekly_commitments (user_id, week_start_date DESC);

ALTER TABLE public.weekly_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Viewers see commitments"
ON public.weekly_commitments FOR SELECT
TO authenticated
USING (public.is_commitment_viewer(auth.uid()));

CREATE POLICY "Leaders declare own commitments"
ON public.weekly_commitments FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.is_commitment_viewer(auth.uid())
  AND status = 'em_andamento'
  AND (evidencia IS NULL OR evidencia = '')
);

CREATE POLICY "Author edits or evaluates commitments"
ON public.weekly_commitments FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR (user_id = auth.uid() AND current_date <= week_start_date + 6)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR (user_id = auth.uid() AND current_date <= week_start_date + 6)
);

CREATE TRIGGER update_weekly_commitments_updated_at
BEFORE UPDATE ON public.weekly_commitments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
