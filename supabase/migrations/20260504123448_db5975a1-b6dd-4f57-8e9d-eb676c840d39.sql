-- ============================================
-- COVERAGE BETWEEN STORES (emergency shift coverage)
-- ============================================

-- 1) profiles columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS available_for_coverage boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coverage_dates daterange[] NULL;

-- 2) coverage_requests table
CREATE TABLE IF NOT EXISTS public.coverage_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_gerente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_unit_id uuid NOT NULL REFERENCES public.units(id),
  target_date date NOT NULL,
  target_shift_start time NOT NULL,
  target_shift_end time NOT NULL,
  setor text,
  urgency text NOT NULL DEFAULT 'média' CHECK (urgency IN ('alta','média','baixa')),
  accepted_by_user_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','aceito','recusado','cancelado','concluido')),
  message text,
  reminded_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coverage_requests_status_date
  ON public.coverage_requests(status, target_date);
CREATE INDEX IF NOT EXISTS idx_coverage_requests_requester
  ON public.coverage_requests(requester_gerente_id);
CREATE INDEX IF NOT EXISTS idx_coverage_requests_accepted_by
  ON public.coverage_requests(accepted_by_user_id);

ALTER TABLE public.coverage_requests ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_coverage_requests_updated_at
BEFORE UPDATE ON public.coverage_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) coverage_invites table
CREATE TABLE IF NOT EXISTS public.coverage_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.coverage_requests(id) ON DELETE CASCADE,
  invitee_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aceito','recusado','cancelado')),
  responded_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, invitee_user_id)
);

CREATE INDEX IF NOT EXISTS idx_coverage_invites_invitee_status
  ON public.coverage_invites(invitee_user_id, status);
CREATE INDEX IF NOT EXISTS idx_coverage_invites_request
  ON public.coverage_invites(request_id);

ALTER TABLE public.coverage_invites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper: profile_id <-> auth.uid lookup
-- ============================================
CREATE OR REPLACE FUNCTION public.coverage_profile_id_for(_uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _uid LIMIT 1;
$$;

-- ============================================
-- RLS: coverage_requests
-- ============================================
CREATE POLICY "View coverage requests"
ON public.coverage_requests FOR SELECT TO authenticated
USING (
  requester_gerente_id = public.coverage_profile_id_for(auth.uid())
  OR accepted_by_user_id = public.coverage_profile_id_for(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.available_for_coverage = true
  )
  OR has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
);

CREATE POLICY "Managers create coverage requests"
ON public.coverage_requests FOR INSERT TO authenticated
WITH CHECK (
  requester_gerente_id = public.coverage_profile_id_for(auth.uid())
  AND (
    has_role(auth.uid(), 'gerente_loja'::cargo_tipo)
    OR has_role(auth.uid(), 'gerente'::cargo_tipo)
    OR has_role(auth.uid(), 'admin'::cargo_tipo)
    OR has_role(auth.uid(), 'master'::cargo_tipo)
    OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
  )
);

CREATE POLICY "Update coverage requests"
ON public.coverage_requests FOR UPDATE TO authenticated
USING (
  requester_gerente_id = public.coverage_profile_id_for(auth.uid())
  OR accepted_by_user_id = public.coverage_profile_id_for(auth.uid())
  OR has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
)
WITH CHECK (
  requester_gerente_id = public.coverage_profile_id_for(auth.uid())
  OR accepted_by_user_id = public.coverage_profile_id_for(auth.uid())
  OR has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
);

CREATE POLICY "Delete open coverage requests"
ON public.coverage_requests FOR DELETE TO authenticated
USING (
  status = 'aberto'
  AND requester_gerente_id = public.coverage_profile_id_for(auth.uid())
);

-- ============================================
-- RLS: coverage_invites
-- ============================================
CREATE POLICY "View coverage invites"
ON public.coverage_invites FOR SELECT TO authenticated
USING (
  invitee_user_id = public.coverage_profile_id_for(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.coverage_requests r
    WHERE r.id = coverage_invites.request_id
      AND r.requester_gerente_id = public.coverage_profile_id_for(auth.uid())
  )
  OR has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
);

CREATE POLICY "Requester creates invites"
ON public.coverage_invites FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.coverage_requests r
    WHERE r.id = coverage_invites.request_id
      AND r.requester_gerente_id = public.coverage_profile_id_for(auth.uid())
  )
);

CREATE POLICY "Update invites by invitee or requester"
ON public.coverage_invites FOR UPDATE TO authenticated
USING (
  invitee_user_id = public.coverage_profile_id_for(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.coverage_requests r
    WHERE r.id = coverage_invites.request_id
      AND r.requester_gerente_id = public.coverage_profile_id_for(auth.uid())
  )
)
WITH CHECK (
  invitee_user_id = public.coverage_profile_id_for(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.coverage_requests r
    WHERE r.id = coverage_invites.request_id
      AND r.requester_gerente_id = public.coverage_profile_id_for(auth.uid())
  )
);

-- ============================================
-- Triggers: notifications + cascade
-- ============================================

-- Notify invitee when invite created
CREATE OR REPLACE FUNCTION public.tg_coverage_invite_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.coverage_requests%ROWTYPE;
  v_invitee_user uuid;
  v_unit_name text;
BEGIN
  SELECT * INTO v_req FROM public.coverage_requests WHERE id = NEW.request_id;
  SELECT user_id INTO v_invitee_user FROM public.profiles WHERE id = NEW.invitee_user_id;
  SELECT name INTO v_unit_name FROM public.units WHERE id = v_req.requester_unit_id;

  INSERT INTO public.notification_events (type, recipient_user_id, title, body, payload, grouping_key)
  VALUES (
    'meeting_reminder',
    v_invitee_user,
    'Convite de cobertura — ' || COALESCE(v_unit_name, 'outra loja'),
    'Você foi convidado para cobrir um turno em ' || to_char(v_req.target_date, 'DD/MM') ||
      ' das ' || to_char(v_req.target_shift_start, 'HH24:MI') ||
      ' às ' || to_char(v_req.target_shift_end, 'HH24:MI') ||
      ' (urgência: ' || v_req.urgency || ').',
    jsonb_build_object(
      'kind', 'coverage_invite',
      'invite_id', NEW.id,
      'request_id', v_req.id,
      'target_date', v_req.target_date,
      'unit_id', v_req.requester_unit_id
    ),
    'coverage_invite:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coverage_invite_notify
AFTER INSERT ON public.coverage_invites
FOR EACH ROW EXECUTE FUNCTION public.tg_coverage_invite_notify();

-- When invite status changes: notify requester + cascade to request
CREATE OR REPLACE FUNCTION public.tg_coverage_invite_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.coverage_requests%ROWTYPE;
  v_requester_user uuid;
  v_invitee_name text;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_req FROM public.coverage_requests WHERE id = NEW.request_id;
  SELECT user_id INTO v_requester_user FROM public.profiles WHERE id = v_req.requester_gerente_id;
  SELECT nome INTO v_invitee_name FROM public.profiles WHERE id = NEW.invitee_user_id;

  -- Mark responded_at
  IF NEW.status IN ('aceito','recusado') AND NEW.responded_at IS NULL THEN
    NEW.responded_at := now();
  END IF;

  -- Cascade accept
  IF NEW.status = 'aceito' THEN
    UPDATE public.coverage_requests
       SET status = 'aceito',
           accepted_by_user_id = NEW.invitee_user_id,
           updated_at = now()
     WHERE id = NEW.request_id AND status = 'aberto';

    -- Cancel other pending invites for the same request
    UPDATE public.coverage_invites
       SET status = 'cancelado'
     WHERE request_id = NEW.request_id
       AND id <> NEW.id
       AND status = 'pendente';
  END IF;

  -- Notify requester
  INSERT INTO public.notification_events (type, recipient_user_id, title, body, payload, grouping_key)
  VALUES (
    'meeting_reminder',
    v_requester_user,
    CASE WHEN NEW.status = 'aceito' THEN 'Cobertura aceita ✅' ELSE 'Cobertura recusada' END,
    COALESCE(v_invitee_name, 'Colaborador') ||
      CASE WHEN NEW.status = 'aceito' THEN ' aceitou cobrir o turno em ' ELSE ' recusou cobrir o turno em ' END ||
      to_char(v_req.target_date, 'DD/MM') || '.',
    jsonb_build_object(
      'kind', 'coverage_invite_response',
      'invite_id', NEW.id,
      'request_id', NEW.request_id,
      'response', NEW.status
    ),
    'coverage_invite_resp:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coverage_invite_response
BEFORE UPDATE ON public.coverage_invites
FOR EACH ROW EXECUTE FUNCTION public.tg_coverage_invite_response();

-- ============================================
-- "Salvador" achievement
-- ============================================
INSERT INTO public.achievements (code, name, description, icon, category, criteria_type, criteria_target, criteria_metric, active, ordem)
VALUES (
  'salvador',
  'Salvador',
  'Cobriu turnos em outras lojas em momentos de necessidade. 3 coberturas concluídas.',
  '🦸',
  'cultura',
  'count',
  3,
  'coverage_completed',
  true,
  50
)
ON CONFLICT (code) DO NOTHING;

-- Trigger: when coverage marked concluido, count and unlock badge
CREATE OR REPLACE FUNCTION public.tg_coverage_award_salvador()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_user_uid uuid;
  v_ach_id uuid;
BEGIN
  IF NEW.status <> 'concluido' OR OLD.status = 'concluido' OR NEW.accepted_by_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count
    FROM public.coverage_requests
   WHERE accepted_by_user_id = NEW.accepted_by_user_id
     AND status = 'concluido';

  SELECT user_id INTO v_user_uid FROM public.profiles WHERE id = NEW.accepted_by_user_id;
  SELECT id INTO v_ach_id FROM public.achievements WHERE code = 'salvador';

  IF v_user_uid IS NULL OR v_ach_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_achievements (user_id, achievement_id, current_progress, completed, unlocked_at, last_calculated_at)
  VALUES (
    v_user_uid,
    v_ach_id,
    v_count,
    v_count >= 3,
    CASE WHEN v_count >= 3 THEN now() ELSE NULL END,
    now()
  )
  ON CONFLICT (user_id, achievement_id) DO UPDATE
    SET current_progress = EXCLUDED.current_progress,
        completed = EXCLUDED.completed OR public.user_achievements.completed,
        unlocked_at = COALESCE(public.user_achievements.unlocked_at, EXCLUDED.unlocked_at),
        last_calculated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coverage_award_salvador
AFTER UPDATE ON public.coverage_requests
FOR EACH ROW EXECUTE FUNCTION public.tg_coverage_award_salvador();