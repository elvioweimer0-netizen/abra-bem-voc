
CREATE TABLE public.daily_huddle_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date NOT NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  bo_dia text NOT NULL DEFAULT '',
  informativos text NOT NULL DEFAULT '',
  venda_dia_anterior numeric(12,2),
  meta_dia numeric(12,2),
  meta_status text NOT NULL DEFAULT 'no_caminho' CHECK (meta_status IN ('no_caminho','em_risco','atingida','nao_atingida')),
  observacao text NOT NULL DEFAULT '',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_date, unit_id)
);

CREATE INDEX idx_daily_huddle_reports_date_unit ON public.daily_huddle_reports (report_date DESC, unit_id);

ALTER TABLE public.daily_huddle_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Huddle scoped view"
ON public.daily_huddle_reports FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR public.user_can_access_unit(auth.uid(), unit_id)
);

CREATE POLICY "Leadership creates huddle"
ON public.daily_huddle_reports FOR INSERT
TO authenticated
WITH CHECK (
  author_user_id = auth.uid()
  AND public.is_leadership(auth.uid())
  AND public.user_can_access_unit(auth.uid(), unit_id)
);

CREATE POLICY "Author updates same day huddle"
ON public.daily_huddle_reports FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR (author_user_id = auth.uid() AND report_date = current_date)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR (author_user_id = auth.uid() AND report_date = current_date)
);

CREATE TRIGGER update_daily_huddle_reports_updated_at
BEFORE UPDATE ON public.daily_huddle_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
