-- Tabela
CREATE TABLE public.safety_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registered_by_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE RESTRICT,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
  setor text,
  incident_type text NOT NULL CHECK (incident_type IN ('queda','corte','queimadura','choque_eletrico','quase_acidente','exposicao_quimica','assalto','outro')),
  severity text NOT NULL CHECK (severity IN ('quase_acidente','leve','moderado','grave','muito_grave')),
  description text NOT NULL,
  occurred_at timestamptz NOT NULL,
  location_in_store text,
  people_involved text,
  action_immediate text,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  root_cause text,
  action_corrective text,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','investigando','corrigido','arquivado')),
  resolved_at timestamptz,
  resolved_by_user_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_safety_incidents_unit_date ON public.safety_incidents (unit_id, occurred_at DESC);
CREATE INDEX idx_safety_incidents_status_severity ON public.safety_incidents (status, severity);

-- Trigger updated_at
CREATE TRIGGER tg_safety_incidents_updated_at
BEFORE UPDATE ON public.safety_incidents
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- RLS
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;

-- Helper: quem é "RH/admin amplo" para segurança
CREATE OR REPLACE FUNCTION public.is_safety_viewer(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid, 'admin'::cargo_tipo)
      OR public.has_role(_uid, 'master'::cargo_tipo)
      OR public.has_role(_uid, 'supervisor'::cargo_tipo)
      OR public.is_rh_or_admin(_uid)
      OR (
        public.has_role(_uid, 'gerente_adm'::cargo_tipo)
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = _uid
            AND lower(coalesce(p.cargo_titulo,'') || ' ' || coalesce(p.descricao,'') || ' ' || coalesce(p.nome,''))
                ~ '(recursos humanos|departamento pessoal|\mrh\M|\mdp\M)'
        )
      )
$$;

-- INSERT: qualquer user que tenha acesso à unit, e registered_by = auth.uid()
CREATE POLICY "Users can register incidents in their unit"
ON public.safety_incidents
FOR INSERT TO authenticated
WITH CHECK (
  registered_by_user_id = auth.uid()
  AND public.user_can_access_unit(auth.uid(), unit_id)
);

-- SELECT: gerente da unit OR safety viewer (admin/master/sup/RH)
CREATE POLICY "Unit managers and safety viewers can read incidents"
ON public.safety_incidents
FOR SELECT TO authenticated
USING (
  public.is_safety_viewer(auth.uid())
  OR public.is_unit_manager(auth.uid(), unit_id)
  OR registered_by_user_id = auth.uid()
);

-- UPDATE: gerente_loja da unit OR admin/master
CREATE POLICY "Managers and admins can investigate incidents"
ON public.safety_incidents
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR (public.has_role(auth.uid(), 'gerente_loja'::cargo_tipo) AND public.user_can_access_unit(auth.uid(), unit_id))
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR (public.has_role(auth.uid(), 'gerente_loja'::cargo_tipo) AND public.user_can_access_unit(auth.uid(), unit_id))
);

-- View para Heatmap (segurança via barrier)
CREATE OR REPLACE VIEW public.v_safety_incidents_heatmap
WITH (security_invoker = true) AS
SELECT
  unit_id,
  date_trunc('month', occurred_at)::date AS month,
  count(*)::int AS total_incidents,
  count(*) FILTER (WHERE severity IN ('grave','muito_grave'))::int AS severe_count,
  count(*) FILTER (WHERE severity = 'quase_acidente')::int AS near_miss_count
FROM public.safety_incidents
GROUP BY unit_id, date_trunc('month', occurred_at);

-- Trigger de notificação para incidentes graves
CREATE OR REPLACE FUNCTION public.tg_safety_incident_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recipient record;
  _registrant text;
  _unit_code text;
  _body text;
BEGIN
  IF NEW.severity NOT IN ('grave','muito_grave') THEN RETURN NEW; END IF;

  SELECT nome INTO _registrant FROM public.profiles WHERE user_id = NEW.registered_by_user_id;
  SELECT code INTO _unit_code FROM public.units WHERE id = NEW.unit_id;

  _body := '⚠️ Incidente ' || NEW.severity || ' (' || NEW.incident_type || ') registrado'
        || COALESCE(' por ' || _registrant, '')
        || COALESCE(' em ' || _unit_code, '');

  -- Gerentes da unit
  FOR recipient IN
    SELECT DISTINCT p.user_id FROM public.profiles p
    WHERE p.unit_id = NEW.unit_id AND p.ativo = true AND p.user_id IS NOT NULL
      AND public.is_unit_manager(p.user_id, NEW.unit_id)
  LOOP
    INSERT INTO public.notification_events (type, recipient_user_id, unit_id, title, body, payload)
    VALUES ('high_occurrence', recipient.user_id, NEW.unit_id, 'Incidente de segurança', _body,
            jsonb_build_object('incident_id', NEW.id, 'severity', NEW.severity));
  END LOOP;

  -- RH/master imediato em muito_grave
  IF NEW.severity = 'muito_grave' THEN
    FOR recipient IN
      SELECT DISTINCT p.user_id FROM public.profiles p
      WHERE p.ativo = true AND p.user_id IS NOT NULL
        AND (public.is_rh_or_admin(p.user_id) OR public.has_role(p.user_id, 'master'::cargo_tipo))
    LOOP
      INSERT INTO public.notification_events (type, recipient_user_id, unit_id, title, body, payload)
      VALUES ('high_occurrence', recipient.user_id, NEW.unit_id, '🚨 Incidente MUITO GRAVE', _body,
              jsonb_build_object('incident_id', NEW.id, 'severity', NEW.severity));
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_safety_incident_notify_after_insert
AFTER INSERT ON public.safety_incidents
FOR EACH ROW EXECUTE FUNCTION public.tg_safety_incident_notify();

-- Storage bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('safety-incident-photos', 'safety-incident-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Policies do bucket: path prefixado por {unit_id}/...
CREATE POLICY "Safety photos: read by unit access or safety viewer"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'safety-incident-photos'
  AND (
    public.is_safety_viewer(auth.uid())
    OR public.user_can_access_unit(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);

CREATE POLICY "Safety photos: upload by unit access"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'safety-incident-photos'
  AND public.user_can_access_unit(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Safety photos: delete by manager or admin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'safety-incident-photos'
  AND (
    public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.is_unit_manager(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);