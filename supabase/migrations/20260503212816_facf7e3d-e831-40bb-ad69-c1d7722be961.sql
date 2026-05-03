
-- Extensão para sha256
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela de segredos internos (sem policies = ninguém acessa via API)
CREATE TABLE IF NOT EXISTS public.app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_secrets FROM PUBLIC, anon, authenticated;

-- Salt aleatório forte (gerado uma vez na migration)
INSERT INTO public.app_secrets (key, value)
VALUES ('manager_feedback_salt', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- ============= Tabelas =============
CREATE TABLE public.manager_feedback_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year smallint NOT NULL,
  quarter smallint NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closes_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','fechado','consolidado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, quarter)
);

CREATE TABLE public.manager_feedback_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  question_text text NOT NULL,
  ordem smallint NOT NULL DEFAULT 0,
  scale_min int NOT NULL DEFAULT 1,
  scale_max int NOT NULL DEFAULT 5,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.manager_feedback_questions (code, question_text, ordem) VALUES
  ('feedback_util', 'Seu gerente te dá feedback útil quando precisa?', 1),
  ('justo',         'Seu gerente é justo nas decisões?', 2),
  ('ouve',          'Seu gerente ouve sua opinião?', 3),
  ('acolhe',        'Seu gerente acolhe quando você precisa?', 4),
  ('ensina',        'Seu gerente te ensina coisas que ajudam você crescer?', 5);

CREATE TABLE public.manager_feedback_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.manager_feedback_cycles(id) ON DELETE CASCADE,
  manager_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  respondent_hash text NOT NULL,
  question_id uuid NOT NULL REFERENCES public.manager_feedback_questions(id) ON DELETE CASCADE,
  score int NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, manager_user_id, respondent_hash, question_id)
);
CREATE INDEX idx_mfr_cycle_manager ON public.manager_feedback_responses(cycle_id, manager_user_id);
CREATE INDEX idx_mfr_manager ON public.manager_feedback_responses(manager_user_id);

-- ============= Hash irreversível (server-side) =============
CREATE OR REPLACE FUNCTION public.compute_feedback_hash(_user_id uuid, _cycle_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _salt text;
BEGIN
  SELECT value INTO _salt FROM public.app_secrets WHERE key = 'manager_feedback_salt';
  IF _salt IS NULL THEN RAISE EXCEPTION 'feedback salt not configured'; END IF;
  RETURN encode(digest(_salt || ':' || _user_id::text || ':' || _cycle_id::text, 'sha256'), 'hex');
END;
$$;
REVOKE EXECUTE ON FUNCTION public.compute_feedback_hash(uuid, uuid) FROM PUBLIC, anon;

-- Trigger que força hash + valida regras antes de inserir
CREATE OR REPLACE FUNCTION public.tg_mfr_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _cycle_status text;
  _user_unit uuid;
  _manager_unit uuid;
  _manager_role text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF _uid = NEW.manager_user_id THEN RAISE EXCEPTION 'Não pode avaliar a si mesmo'; END IF;

  SELECT status INTO _cycle_status FROM public.manager_feedback_cycles WHERE id = NEW.cycle_id;
  IF _cycle_status IS DISTINCT FROM 'aberto' THEN RAISE EXCEPTION 'Ciclo não está aberto'; END IF;

  SELECT unit_id INTO _user_unit FROM public.profiles WHERE user_id = _uid;
  SELECT unit_id, cargo::text INTO _manager_unit, _manager_role FROM public.profiles WHERE user_id = NEW.manager_user_id;
  IF _manager_unit IS NULL OR _user_unit IS NULL OR _manager_unit <> _user_unit THEN
    RAISE EXCEPTION 'Manager e respondente precisam ser da mesma unidade';
  END IF;
  IF _manager_role NOT IN ('gerente_loja','gerente') THEN
    RAISE EXCEPTION 'Apenas gerentes podem ser avaliados';
  END IF;

  -- força o hash server-side
  NEW.respondent_hash := public.compute_feedback_hash(_uid, NEW.cycle_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mfr_before_insert
BEFORE INSERT ON public.manager_feedback_responses
FOR EACH ROW EXECUTE FUNCTION public.tg_mfr_before_insert();

CREATE TRIGGER trg_mfc_updated_at BEFORE UPDATE ON public.manager_feedback_cycles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= RLS =============
ALTER TABLE public.manager_feedback_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_feedback_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_feedback_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY mfc_select ON public.manager_feedback_cycles FOR SELECT TO authenticated USING (true);
CREATE POLICY mfc_insert ON public.manager_feedback_cycles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'master') OR has_role(auth.uid(),'supervisor'));
CREATE POLICY mfc_update ON public.manager_feedback_cycles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'master') OR has_role(auth.uid(),'supervisor'));
CREATE POLICY mfc_delete ON public.manager_feedback_cycles FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'master'));

CREATE POLICY mfq_select ON public.manager_feedback_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY mfq_insert ON public.manager_feedback_questions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'master'));
CREATE POLICY mfq_update ON public.manager_feedback_questions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'master'));
CREATE POLICY mfq_delete ON public.manager_feedback_questions FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'master'));

-- responses: INSERT autenticados (trigger valida o resto). SELECT só master (auditoria emergencial).
CREATE POLICY mfr_insert ON public.manager_feedback_responses FOR INSERT TO authenticated
  WITH CHECK (true); -- trigger faz validação completa
CREATE POLICY mfr_select_master ON public.manager_feedback_responses FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'master'));
-- sem UPDATE/DELETE policies → bloqueado pra todos exceto bypass

-- ============= Função de agregação anônima =============
-- Retorna agregados só se count >= 3 (proteção anonimato)
CREATE OR REPLACE FUNCTION public.fn_manager_feedback_aggregated(
  _manager_user_id uuid,
  _cycle_id uuid DEFAULT NULL
)
RETURNS TABLE(
  cycle_id uuid,
  question_id uuid,
  question_code text,
  question_text text,
  ordem smallint,
  avg_score numeric,
  count_responses int,
  distribution jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  -- autorização: o próprio gerente, ou supervisor/admin/master
  IF NOT (
    _uid = _manager_user_id
    OR has_role(_uid,'admin')
    OR has_role(_uid,'master')
    OR has_role(_uid,'supervisor')
  ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  RETURN QUERY
  SELECT
    r.cycle_id,
    r.question_id,
    q.code,
    q.question_text,
    q.ordem,
    round(avg(r.score)::numeric, 2) AS avg_score,
    count(*)::int AS count_responses,
    jsonb_build_object(
      '1', count(*) FILTER (WHERE r.score = 1),
      '2', count(*) FILTER (WHERE r.score = 2),
      '3', count(*) FILTER (WHERE r.score = 3),
      '4', count(*) FILTER (WHERE r.score = 4),
      '5', count(*) FILTER (WHERE r.score = 5)
    ) AS distribution
  FROM public.manager_feedback_responses r
  JOIN public.manager_feedback_questions q ON q.id = r.question_id
  WHERE r.manager_user_id = _manager_user_id
    AND (_cycle_id IS NULL OR r.cycle_id = _cycle_id)
  GROUP BY r.cycle_id, r.question_id, q.code, q.question_text, q.ordem
  HAVING count(*) >= 3
  ORDER BY r.cycle_id DESC, q.ordem;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.fn_manager_feedback_aggregated(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_manager_feedback_aggregated(uuid, uuid) TO authenticated;

-- Comentários anônimos (lista embaralhada)
CREATE OR REPLACE FUNCTION public.fn_manager_feedback_comments(
  _manager_user_id uuid,
  _cycle_id uuid
)
RETURNS TABLE(comment text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); _total int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT (_uid = _manager_user_id OR has_role(_uid,'admin') OR has_role(_uid,'master') OR has_role(_uid,'supervisor')) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  SELECT count(DISTINCT respondent_hash) INTO _total
  FROM public.manager_feedback_responses
  WHERE manager_user_id = _manager_user_id AND cycle_id = _cycle_id;
  IF _total < 3 THEN RETURN; END IF;
  RETURN QUERY
  SELECT r.comment
  FROM public.manager_feedback_responses r
  WHERE r.manager_user_id = _manager_user_id
    AND r.cycle_id = _cycle_id
    AND r.comment IS NOT NULL
    AND length(trim(r.comment)) > 0
  ORDER BY random();
END;
$$;
REVOKE EXECUTE ON FUNCTION public.fn_manager_feedback_comments(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_manager_feedback_comments(uuid, uuid) TO authenticated;

-- Função utilitária: já respondeu o ciclo?
CREATE OR REPLACE FUNCTION public.fn_user_already_answered_cycle(_cycle_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _hash text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  _hash := public.compute_feedback_hash(auth.uid(), _cycle_id);
  RETURN EXISTS (
    SELECT 1 FROM public.manager_feedback_responses
    WHERE cycle_id = _cycle_id AND respondent_hash = _hash
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.fn_user_already_answered_cycle(uuid) TO authenticated;
