
-- ============ TABELA: shifts ============
CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id),
  setor text,
  shift_date date NOT NULL,
  shift_start time NOT NULL,
  shift_end time NOT NULL,
  role_in_shift text,
  status text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado','realizado','falta','folga')),
  notes text,
  reminded_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shifts_unit_date ON public.shifts(unit_id, shift_date);
CREATE INDEX idx_shifts_user_date ON public.shifts(user_id, shift_date DESC);
CREATE INDEX idx_shifts_reminder ON public.shifts(shift_date, shift_start) WHERE reminded_at IS NULL AND status = 'agendado';

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shifts_select" ON public.shifts FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_unit_manager(auth.uid(), unit_id)
  OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
);

CREATE POLICY "shifts_insert" ON public.shifts FOR INSERT TO authenticated
WITH CHECK (
  public.is_unit_manager(auth.uid(), unit_id)
  OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
);

CREATE POLICY "shifts_update" ON public.shifts FOR UPDATE TO authenticated
USING (
  public.is_unit_manager(auth.uid(), unit_id)
  OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
);

CREATE POLICY "shifts_delete" ON public.shifts FOR DELETE TO authenticated
USING (
  public.is_unit_manager(auth.uid(), unit_id)
  OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
);

CREATE TRIGGER tg_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ TABELA: shift_swaps ============
CREATE TABLE public.shift_swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_shift_id uuid NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL,
  swap_with_user_id uuid,
  message text,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','aceito','recusado','aprovado_gerente','cancelado')),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shift_swaps_status ON public.shift_swaps(status);
CREATE INDEX idx_shift_swaps_shift ON public.shift_swaps(original_shift_id);

ALTER TABLE public.shift_swaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shift_swaps_select" ON public.shift_swaps FOR SELECT TO authenticated
USING (
  requester_user_id = auth.uid()
  OR swap_with_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = original_shift_id
      AND (public.is_unit_manager(auth.uid(), s.unit_id)
           OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
           OR public.has_role(auth.uid(), 'master'::cargo_tipo))
  )
);

CREATE POLICY "shift_swaps_insert" ON public.shift_swaps FOR INSERT TO authenticated
WITH CHECK (
  requester_user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.shifts s WHERE s.id = original_shift_id AND s.user_id = auth.uid())
);

CREATE POLICY "shift_swaps_update" ON public.shift_swaps FOR UPDATE TO authenticated
USING (
  requester_user_id = auth.uid()
  OR swap_with_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = original_shift_id
      AND (public.is_unit_manager(auth.uid(), s.unit_id)
           OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
           OR public.has_role(auth.uid(), 'master'::cargo_tipo))
  )
);

-- ============ TRIGGERS DE NOTIFICAÇÃO ============
CREATE OR REPLACE FUNCTION public.tg_shift_swap_request_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _shift record;
  _requester_name text;
  recipient record;
BEGIN
  SELECT s.unit_id, s.shift_date, s.shift_start INTO _shift
  FROM public.shifts s WHERE s.id = NEW.original_shift_id;

  SELECT nome INTO _requester_name FROM public.profiles WHERE user_id = NEW.requester_user_id;

  -- Notifica colega proposto
  IF NEW.swap_with_user_id IS NOT NULL AND NEW.swap_with_user_id <> NEW.requester_user_id THEN
    INSERT INTO public.notification_events (type, recipient_user_id, unit_id, title, body, payload)
    VALUES ('shift_swap_proposed', NEW.swap_with_user_id, _shift.unit_id,
            'Pedido de troca de turno',
            COALESCE(_requester_name,'Um colega') || ' quer trocar o turno de ' || to_char(_shift.shift_date, 'DD/MM') || ' com você',
            jsonb_build_object('swap_id', NEW.id, 'shift_id', NEW.original_shift_id));
  END IF;

  -- Notifica gerentes da unidade
  FOR recipient IN
    SELECT DISTINCT p.user_id FROM public.profiles p
    WHERE p.unit_id = _shift.unit_id AND p.ativo = true AND p.user_id IS NOT NULL
      AND public.is_unit_manager(p.user_id, _shift.unit_id)
      AND p.user_id <> NEW.requester_user_id
  LOOP
    INSERT INTO public.notification_events (type, recipient_user_id, unit_id, title, body, payload)
    VALUES ('shift_swap_request', recipient.user_id, _shift.unit_id,
            'Nova solicitação de troca',
            COALESCE(_requester_name,'Colaborador') || ' solicitou troca para ' || to_char(_shift.shift_date, 'DD/MM'),
            jsonb_build_object('swap_id', NEW.id, 'shift_id', NEW.original_shift_id));
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_shift_swap_request_notify
  AFTER INSERT ON public.shift_swaps
  FOR EACH ROW EXECUTE FUNCTION public.tg_shift_swap_request_notify();

CREATE OR REPLACE FUNCTION public.tg_shift_swap_status_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _label text;
  _responder_name text;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('aceito','recusado','aprovado_gerente','cancelado') THEN RETURN NEW; END IF;

  SELECT nome INTO _responder_name FROM public.profiles WHERE user_id = auth.uid();

  _label := CASE NEW.status
    WHEN 'aceito' THEN 'aceitou'
    WHEN 'recusado' THEN 'recusou'
    WHEN 'aprovado_gerente' THEN 'aprovou'
    WHEN 'cancelado' THEN 'cancelou'
  END;

  INSERT INTO public.notification_events (type, recipient_user_id, title, body, payload)
  VALUES ('shift_swap_status', NEW.requester_user_id,
          'Troca de turno atualizada',
          COALESCE(_responder_name,'Alguém') || ' ' || _label || ' sua solicitação',
          jsonb_build_object('swap_id', NEW.id, 'status', NEW.status));

  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_shift_swap_status_notify
  AFTER UPDATE ON public.shift_swaps
  FOR EACH ROW EXECUTE FUNCTION public.tg_shift_swap_status_notify();
