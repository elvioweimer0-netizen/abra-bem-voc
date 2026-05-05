
-- 1) Table
CREATE TABLE IF NOT EXISTS public.org_solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  tipo_solicitacao text NOT NULL DEFAULT 'aumentar_quadro'
    CHECK (tipo_solicitacao IN ('aumentar_quadro','contratacao_emergencial','remanejamento_excedente')),
  setor_alvo text,
  posicao_alvo text,
  aumento_pretendido smallint NOT NULL DEFAULT 1,
  justificativa_texto text NOT NULL,
  numeros_jsonb jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','aprovada','recusada','cancelada')),
  solicitado_por uuid REFERENCES public.profiles(id),
  solicitado_em timestamptz NOT NULL DEFAULT now(),
  decidido_por uuid REFERENCES public.profiles(id),
  decidido_em timestamptz,
  motivo_decisao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_solicitacoes_unit ON public.org_solicitacoes(unit_id);
CREATE INDEX IF NOT EXISTS idx_org_solicitacoes_status ON public.org_solicitacoes(status);

ALTER TABLE public.org_solicitacoes ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_org_solicitacoes_updated ON public.org_solicitacoes;
CREATE TRIGGER trg_org_solicitacoes_updated
BEFORE UPDATE ON public.org_solicitacoes
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- RLS
DROP POLICY IF EXISTS "Master/admin view all solicitacoes" ON public.org_solicitacoes;
CREATE POLICY "Master/admin view all solicitacoes"
ON public.org_solicitacoes FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master')
  OR public.is_unit_manager(auth.uid(), unit_id)
);

DROP POLICY IF EXISTS "Manager insert solicitacao" ON public.org_solicitacoes;
CREATE POLICY "Manager insert solicitacao"
ON public.org_solicitacoes FOR INSERT TO authenticated
WITH CHECK (
  public.is_unit_manager(auth.uid(), unit_id)
  AND solicitado_por = public.coverage_profile_id_for(auth.uid())
);

DROP POLICY IF EXISTS "Master decide solicitacao" ON public.org_solicitacoes;
CREATE POLICY "Master decide solicitacao"
ON public.org_solicitacoes FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));

DROP POLICY IF EXISTS "Manager cancel own pending solicitacao" ON public.org_solicitacoes;
CREATE POLICY "Manager cancel own pending solicitacao"
ON public.org_solicitacoes FOR UPDATE TO authenticated
USING (
  status = 'pendente'
  AND solicitado_por = public.coverage_profile_id_for(auth.uid())
)
WITH CHECK (
  status IN ('pendente','cancelada')
  AND solicitado_por = public.coverage_profile_id_for(auth.uid())
);

-- 2) Trigger: enforce total_desejado limit on org_alocacoes
CREATE OR REPLACE FUNCTION public.tg_org_alocacoes_enforce_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _desejado int;
  _atual int;
BEGIN
  -- Master/admin always allowed
  IF public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(total_desejado,0) INTO _desejado FROM public.units WHERE id = NEW.unit_id;
  IF _desejado IS NULL OR _desejado <= 0 THEN
    -- units without a desired total are unrestricted (other units keep current behavior)
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO _atual FROM public.org_alocacoes WHERE unit_id = NEW.unit_id;

  -- On UPDATE of an existing allocation (same row) the count doesn't grow.
  IF TG_OP = 'UPDATE' AND OLD.unit_id = NEW.unit_id THEN
    RETURN NEW;
  END IF;

  IF _atual >= _desejado THEN
    RAISE EXCEPTION 'EXCEEDS_DESIRED: unidade ja esta no limite de % pessoas. Solicite autorizacao do master.', _desejado
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_alocacoes_enforce_limit ON public.org_alocacoes;
CREATE TRIGGER trg_org_alocacoes_enforce_limit
BEFORE INSERT OR UPDATE ON public.org_alocacoes
FOR EACH ROW EXECUTE FUNCTION public.tg_org_alocacoes_enforce_limit();

-- 3) Notify master on new pending request
CREATE OR REPLACE FUNCTION public.tg_org_solicitacao_notify_master()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  _unit_name text;
  _solic_name text;
BEGIN
  SELECT name INTO _unit_name FROM public.units WHERE id = NEW.unit_id;
  SELECT nome INTO _solic_name FROM public.profiles WHERE id = NEW.solicitado_por;

  FOR r IN
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role IN ('master','admin')
  LOOP
    INSERT INTO public.notification_events (type, recipient_user_id, unit_id, title, body, payload)
    VALUES (
      'high_occurrence',
      r.user_id,
      NEW.unit_id,
      'Pedido de aumento de quadro',
      COALESCE(_solic_name,'Gerente') || ' (' || COALESCE(_unit_name,'unidade') || ') solicitou +'
        || NEW.aumento_pretendido || ' pessoa(s).',
      jsonb_build_object('solicitacao_id', NEW.id, 'unit_id', NEW.unit_id)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_solicitacao_notify_master ON public.org_solicitacoes;
CREATE TRIGGER trg_org_solicitacao_notify_master
AFTER INSERT ON public.org_solicitacoes
FOR EACH ROW
WHEN (NEW.status = 'pendente')
EXECUTE FUNCTION public.tg_org_solicitacao_notify_master();

-- 4) Notify requester on decision
CREATE OR REPLACE FUNCTION public.tg_org_solicitacao_notify_requester()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  IF NEW.status NOT IN ('aprovada','recusada') THEN RETURN NEW; END IF;
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT user_id INTO _user_id FROM public.profiles WHERE id = NEW.solicitado_por;
  IF _user_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notification_events (type, recipient_user_id, unit_id, title, body, payload)
  VALUES (
    'high_occurrence',
    _user_id,
    NEW.unit_id,
    CASE WHEN NEW.status = 'aprovada' THEN 'Solicitação aprovada' ELSE 'Solicitação recusada' END,
    COALESCE(NEW.motivo_decisao, ''),
    jsonb_build_object('solicitacao_id', NEW.id, 'status', NEW.status)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_solicitacao_notify_requester ON public.org_solicitacoes;
CREATE TRIGGER trg_org_solicitacao_notify_requester
AFTER UPDATE ON public.org_solicitacoes
FOR EACH ROW EXECUTE FUNCTION public.tg_org_solicitacao_notify_requester();

-- 5) RPCs: aprovar / recusar
CREATE OR REPLACE FUNCTION public.aprovar_org_solicitacao(_id uuid, _motivo text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _s record;
  _decisor_profile uuid;
  _setor_enum text;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master')) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  SELECT * INTO _s FROM public.org_solicitacoes WHERE id = _id FOR UPDATE;
  IF _s.status <> 'pendente' THEN
    RAISE EXCEPTION 'Solicitação já decidida';
  END IF;

  _decisor_profile := public.coverage_profile_id_for(auth.uid());

  -- Bump desired total
  UPDATE public.units
     SET total_desejado = COALESCE(total_desejado,0) + COALESCE(_s.aumento_pretendido,1)
   WHERE id = _s.unit_id;

  -- Mark approved
  UPDATE public.org_solicitacoes
     SET status='aprovada',
         decidido_por=_decisor_profile,
         decidido_em=now(),
         motivo_decisao=_motivo
   WHERE id = _id;

  -- Optionally apply allocation
  IF _s.profile_id IS NOT NULL AND _s.posicao_alvo IS NOT NULL THEN
    INSERT INTO public.org_alocacoes (profile_id, unit_id, posicao, setor, alocado_por)
    VALUES (_s.profile_id, _s.unit_id, _s.posicao_alvo::text, _s.setor_alvo, _decisor_profile)
    ON CONFLICT (profile_id) DO UPDATE
      SET unit_id = EXCLUDED.unit_id,
          posicao = EXCLUDED.posicao,
          setor = EXCLUDED.setor,
          alocado_por = EXCLUDED.alocado_por,
          alocado_em = now();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.recusar_org_solicitacao(_id uuid, _motivo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master')) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  IF _motivo IS NULL OR length(trim(_motivo)) < 3 THEN
    RAISE EXCEPTION 'Motivo da recusa é obrigatório';
  END IF;

  UPDATE public.org_solicitacoes
     SET status='recusada',
         decidido_por=public.coverage_profile_id_for(auth.uid()),
         decidido_em=now(),
         motivo_decisao=_motivo
   WHERE id = _id AND status = 'pendente';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.aprovar_org_solicitacao(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.recusar_org_solicitacao(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.aprovar_org_solicitacao(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recusar_org_solicitacao(uuid, text) TO authenticated;
