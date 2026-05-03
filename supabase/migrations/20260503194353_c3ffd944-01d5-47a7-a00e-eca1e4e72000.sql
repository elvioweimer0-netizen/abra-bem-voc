
CREATE TABLE public.churn_risk_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  calculated_at date NOT NULL DEFAULT CURRENT_DATE,
  risk_score numeric(5,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_action text,
  gerente_notified_at timestamptz,
  rh_escalated_at timestamptz,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','resolvido_1on1','resolvido_outro','falso_positivo','colaborador_saiu')),
  resolution_note text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, calculated_at)
);

CREATE INDEX idx_churn_risk_unit_calc ON public.churn_risk_signals (unit_id, calculated_at DESC);
CREATE INDEX idx_churn_risk_status ON public.churn_risk_signals (status, calculated_at DESC);
CREATE INDEX idx_churn_risk_user ON public.churn_risk_signals (user_id, calculated_at DESC);

ALTER TABLE public.churn_risk_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RH e gerentes leem riscos da sua unidade"
ON public.churn_risk_signals
FOR SELECT
TO authenticated
USING (
  public.is_rh_or_admin(auth.uid())
  OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR (
    public.has_role(auth.uid(), 'gerente_loja'::cargo_tipo)
    AND unit_id IS NOT NULL
    AND public.user_can_access_unit(auth.uid(), unit_id)
  )
);

CREATE TRIGGER trg_churn_risk_updated_at
BEFORE UPDATE ON public.churn_risk_signals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.resolve_churn_risk(_id uuid, _status text, _note text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _unit uuid;
BEGIN
  IF _status NOT IN ('resolvido_1on1','resolvido_outro','falso_positivo','colaborador_saiu','ativo') THEN
    RAISE EXCEPTION 'Status inválido';
  END IF;
  IF _note IS NULL OR length(trim(_note)) < 5 THEN
    RAISE EXCEPTION 'Observação obrigatória (mínimo 5 caracteres)';
  END IF;

  SELECT unit_id INTO _unit FROM public.churn_risk_signals WHERE id = _id;
  IF _unit IS NULL AND NOT public.is_rh_or_admin(auth.uid()) THEN
    -- só RH pode atuar quando não há unidade
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF NOT (
    public.is_rh_or_admin(auth.uid())
    OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
    OR (public.has_role(auth.uid(), 'gerente_loja'::cargo_tipo) AND public.user_can_access_unit(auth.uid(), _unit))
  ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  UPDATE public.churn_risk_signals
  SET status = _status,
      resolution_note = _note,
      resolved_by = auth.uid(),
      resolved_at = now(),
      updated_at = now()
  WHERE id = _id;
END;
$$;
