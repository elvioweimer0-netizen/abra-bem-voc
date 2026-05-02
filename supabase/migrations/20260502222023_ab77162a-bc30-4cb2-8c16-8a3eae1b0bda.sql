
CREATE TABLE IF NOT EXISTS public.visit_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  completion_id uuid REFERENCES public.checklist_completions(id) ON DELETE SET NULL,
  check_in_at timestamptz NOT NULL DEFAULT now(),
  check_out_at timestamptz,
  latitude numeric,
  longitude numeric,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visit_check_ins_unit_date ON public.visit_check_ins(unit_id, check_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_visit_check_ins_user_date ON public.visit_check_ins(user_id, check_in_at DESC);

CREATE TRIGGER trg_visit_check_ins_updated_at
BEFORE UPDATE ON public.visit_check_ins
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.visit_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisors create own visits"
ON public.visit_check_ins FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.visit_check_ins v
    WHERE v.user_id = auth.uid() AND v.check_out_at IS NULL
  )
);

CREATE POLICY "Visits scoped view"
ON public.visit_check_ins FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR public.is_unit_manager(auth.uid(), unit_id)
);

CREATE POLICY "Supervisors close own visits"
ON public.visit_check_ins FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.protect_visit_check_in_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.check_out_at IS NOT NULL AND NEW.check_out_at IS DISTINCT FROM OLD.check_out_at THEN
    RAISE EXCEPTION 'Visita já foi encerrada';
  END IF;
  IF NEW.user_id <> OLD.user_id
     OR NEW.unit_id <> OLD.unit_id
     OR NEW.check_in_at <> OLD.check_in_at
     OR NEW.completion_id IS DISTINCT FROM OLD.completion_id
     OR NEW.latitude IS DISTINCT FROM OLD.latitude
     OR NEW.longitude IS DISTINCT FROM OLD.longitude THEN
    RAISE EXCEPTION 'Apenas check_out_at e observacao podem ser alterados';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_visit_check_in_update
BEFORE UPDATE ON public.visit_check_ins
FOR EACH ROW EXECUTE FUNCTION public.protect_visit_check_in_update();

DO $$
DECLARE
  v_template_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.checklist_templates WHERE period = 'visita_supervisor'::checklist_period AND active = true) THEN
    INSERT INTO public.checklist_templates (name, unit_type, role_target, period, active)
    VALUES ('Visita do Supervisor', 'loja', 'gerente'::checklist_role_target, 'visita_supervisor'::checklist_period, true)
    RETURNING id INTO v_template_id;

    INSERT INTO public.checklist_items (template_id, descricao, ordem, tipo_resposta, obrigatorio, requires_photo) VALUES
      (v_template_id, 'FLV organizado',                 1, 'sim_nao'::checklist_response_type, true, true),
      (v_template_id, 'Padaria com produto',            2, 'sim_nao'::checklist_response_type, true, true),
      (v_template_id, 'Açougue limpo',                  3, 'sim_nao'::checklist_response_type, true, true),
      (v_template_id, 'Atendimento dos colaboradores',  4, 'escala'::checklist_response_type,  true, false),
      (v_template_id, 'Frente de caixa organizada',     5, 'sim_nao'::checklist_response_type, true, false),
      (v_template_id, 'Estoque depósito',               6, 'texto'::checklist_response_type,   true, false);
  END IF;
END $$;
