
-- 1) Fix RLS on org_alocacoes (allow gerente, gerente_loja, gerente_adm of the unit + master/admin)
DROP POLICY IF EXISTS org_alocacoes_modify_managers ON public.org_alocacoes;

CREATE POLICY org_alocacoes_modify_managers
ON public.org_alocacoes
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.unit_id = org_alocacoes.unit_id
      AND p.cargo IN ('gerente'::cargo_tipo,'gerente_loja'::cargo_tipo,'gerente_adm'::cargo_tipo)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.unit_id = org_alocacoes.unit_id
      AND p.cargo IN ('gerente'::cargo_tipo,'gerente_loja'::cargo_tipo,'gerente_adm'::cargo_tipo)
  )
);

-- 2) Approval-cascade columns on org_solicitacoes
ALTER TABLE public.org_solicitacoes
  ADD COLUMN IF NOT EXISTS rh_decidido_por uuid,
  ADD COLUMN IF NOT EXISTS rh_decidido_em timestamptz,
  ADD COLUMN IF NOT EXISTS rh_motivo text,
  ADD COLUMN IF NOT EXISTS master_decidido_por uuid,
  ADD COLUMN IF NOT EXISTS master_decidido_em timestamptz,
  ADD COLUMN IF NOT EXISTS master_motivo text;

-- New status values: pendente_rh / pendente_master / aprovada / recusada / cancelada
-- Existing rows: 'pendente' => 'pendente_rh'
UPDATE public.org_solicitacoes SET status = 'pendente_rh' WHERE status = 'pendente';

-- Drop existing trigger that notified master directly (we'll re-route to RH first)
DROP TRIGGER IF EXISTS tg_org_solicitacao_notify_master ON public.org_solicitacoes;

-- New: notify RH on insert (status pendente_rh)
CREATE OR REPLACE FUNCTION public.tg_org_solicitacao_notify_rh()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  _unit_name text;
  _solic_name text;
BEGIN
  SELECT name INTO _unit_name FROM public.units WHERE id = NEW.unit_id;
  SELECT nome INTO _solic_name FROM public.profiles WHERE id = NEW.solicitado_por;

  FOR r IN
    SELECT DISTINCT p.user_id
    FROM public.profiles p
    WHERE p.user_id IS NOT NULL AND p.ativo = true AND public.is_rh_or_admin(p.user_id)
  LOOP
    INSERT INTO public.notification_events (type, recipient_user_id, unit_id, title, body, payload)
    VALUES (
      'high_occurrence',
      r.user_id,
      NEW.unit_id,
      'Pedido de aumento de quadro (RH)',
      COALESCE(_solic_name,'Gerente') || ' (' || COALESCE(_unit_name,'unidade') || ') solicitou +'
        || NEW.aumento_pretendido || ' pessoa(s). Aguardando triagem do RH.',
      jsonb_build_object('solicitacao_id', NEW.id, 'unit_id', NEW.unit_id, 'etapa','rh')
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_org_solicitacao_notify_rh
AFTER INSERT ON public.org_solicitacoes
FOR EACH ROW EXECUTE FUNCTION public.tg_org_solicitacao_notify_rh();

-- When status moves to pendente_master, notify master
CREATE OR REPLACE FUNCTION public.tg_org_solicitacao_notify_master_step()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record; _unit_name text; _solic_name text;
BEGIN
  IF NEW.status <> 'pendente_master' OR OLD.status = 'pendente_master' THEN RETURN NEW; END IF;

  SELECT name INTO _unit_name FROM public.units WHERE id = NEW.unit_id;
  SELECT nome INTO _solic_name FROM public.profiles WHERE id = NEW.solicitado_por;

  FOR r IN
    SELECT DISTINCT ur.user_id FROM public.user_roles ur WHERE ur.role IN ('master','admin')
  LOOP
    INSERT INTO public.notification_events (type, recipient_user_id, unit_id, title, body, payload)
    VALUES (
      'high_occurrence', r.user_id, NEW.unit_id,
      'Pedido aprovado pelo RH — sua decisão',
      COALESCE(_solic_name,'Gerente') || ' (' || COALESCE(_unit_name,'unidade') || ') · +'
        || NEW.aumento_pretendido || ' pessoa(s). RH aprovou.',
      jsonb_build_object('solicitacao_id', NEW.id, 'unit_id', NEW.unit_id, 'etapa','master')
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_org_solicitacao_notify_master_step
AFTER UPDATE ON public.org_solicitacoes
FOR EACH ROW EXECUTE FUNCTION public.tg_org_solicitacao_notify_master_step();

-- RPC: RH triagem
CREATE OR REPLACE FUNCTION public.triagem_rh_org_solicitacao(_id uuid, _decision text, _motivo text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _profile_id uuid;
BEGIN
  IF NOT public.is_rh_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão (apenas RH/master/admin)';
  END IF;
  IF _decision NOT IN ('aprovar','recusar') THEN
    RAISE EXCEPTION 'Decisão inválida';
  END IF;

  SELECT id INTO _profile_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

  IF _decision = 'aprovar' THEN
    UPDATE public.org_solicitacoes
       SET status = 'pendente_master',
           rh_decidido_por = _profile_id,
           rh_decidido_em = now(),
           rh_motivo = _motivo
     WHERE id = _id AND status = 'pendente_rh';
  ELSE
    UPDATE public.org_solicitacoes
       SET status = 'recusada',
           rh_decidido_por = _profile_id,
           rh_decidido_em = now(),
           rh_motivo = _motivo,
           motivo_decisao = COALESCE(_motivo, 'Recusado pelo RH')
     WHERE id = _id AND status = 'pendente_rh';
  END IF;
END;
$$;

-- Replace aprovar/recusar to require pendente_master and record master fields
CREATE OR REPLACE FUNCTION public.aprovar_org_solicitacao(_id uuid, _motivo text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _s public.org_solicitacoes%ROWTYPE;
  _profile_id uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  SELECT * INTO _s FROM public.org_solicitacoes WHERE id = _id;
  IF _s.id IS NULL OR _s.status <> 'pendente_master' THEN
    RAISE EXCEPTION 'Solicitação inválida ou ainda não passou pelo RH';
  END IF;

  SELECT id INTO _profile_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

  UPDATE public.units SET total_desejado = COALESCE(total_desejado,0) + COALESCE(_s.aumento_pretendido,1)
   WHERE id = _s.unit_id;

  UPDATE public.org_solicitacoes
     SET status = 'aprovada',
         decidido_por = _profile_id,
         decidido_em = now(),
         motivo_decisao = _motivo,
         master_decidido_por = _profile_id,
         master_decidido_em = now(),
         master_motivo = _motivo
   WHERE id = _id;

  IF _s.profile_id IS NOT NULL THEN
    INSERT INTO public.org_alocacoes (profile_id, unit_id, posicao, setor, sub_setor, alocado_por)
    VALUES (_s.profile_id, _s.unit_id, COALESCE(_s.posicao_alvo,'colaborador')::text::"AlocacaoPosicao",
            CASE WHEN _s.setor_alvo IS NULL THEN NULL ELSE _s.setor_alvo END, NULL, _profile_id)
    ON CONFLICT (profile_id) DO UPDATE
      SET unit_id = EXCLUDED.unit_id, posicao = EXCLUDED.posicao, setor = EXCLUDED.setor;
  END IF;
EXCEPTION WHEN undefined_object THEN
  -- fallback when AlocacaoPosicao type not present (text col)
  IF _s.profile_id IS NOT NULL THEN
    INSERT INTO public.org_alocacoes (profile_id, unit_id, posicao, setor, sub_setor, alocado_por)
    VALUES (_s.profile_id, _s.unit_id, COALESCE(_s.posicao_alvo,'colaborador'),
            _s.setor_alvo, NULL, _profile_id)
    ON CONFLICT (profile_id) DO UPDATE
      SET unit_id = EXCLUDED.unit_id, posicao = EXCLUDED.posicao, setor = EXCLUDED.setor;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.recusar_org_solicitacao(_id uuid, _motivo text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _profile_id uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  SELECT id INTO _profile_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
  UPDATE public.org_solicitacoes
     SET status = 'recusada',
         decidido_por = _profile_id,
         decidido_em = now(),
         motivo_decisao = _motivo,
         master_decidido_por = _profile_id,
         master_decidido_em = now(),
         master_motivo = _motivo
   WHERE id = _id AND status = 'pendente_master';
END;
$$;
