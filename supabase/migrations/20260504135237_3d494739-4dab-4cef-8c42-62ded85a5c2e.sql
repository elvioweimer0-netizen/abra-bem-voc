-- ========== WELLBEING CHECK-IN MENSAL ==========

-- 1) Tabela de perguntas
CREATE TABLE public.wellbeing_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  question_text text NOT NULL,
  scale_min int NOT NULL DEFAULT 1,
  scale_max int NOT NULL DEFAULT 5,
  dimension text NOT NULL CHECK (dimension IN ('sono','ansiedade','proposito','conflitos','dinheiro','energia','suporte')),
  reverse_scoring boolean NOT NULL DEFAULT false,
  ordem smallint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wellbeing_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wellbeing_questions select all auth"
  ON public.wellbeing_questions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "wellbeing_questions admin write"
  ON public.wellbeing_questions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));

-- 2) Salt para hash (usa app_secrets existente)
INSERT INTO public.app_secrets (key, value)
VALUES ('wellbeing_salt', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- 3) Função hash de identidade
CREATE OR REPLACE FUNCTION public.wellbeing_hash_user(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _salt text;
BEGIN
  SELECT value INTO _salt FROM public.app_secrets WHERE key = 'wellbeing_salt';
  IF _salt IS NULL THEN RAISE EXCEPTION 'wellbeing salt not configured'; END IF;
  RETURN encode(digest(_salt || ':' || _user_id::text, 'sha256'), 'hex');
END;
$$;

-- 4) Tabela de check-ins
CREATE TABLE public.wellbeing_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  unit_id uuid,
  checkin_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  responses jsonb NOT NULL,
  composite_score numeric(5,2) NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'ok' CHECK (risk_level IN ('ok','atencao','alerta','critico')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, checkin_date)
);

CREATE INDEX idx_wellbeing_checkins_unit_date ON public.wellbeing_checkins(unit_id, checkin_date);
CREATE INDEX idx_wellbeing_checkins_risk_created ON public.wellbeing_checkins(risk_level, created_at);

ALTER TABLE public.wellbeing_checkins ENABLE ROW LEVEL SECURITY;

-- INSERT: somente o próprio user; SELECT/UPDATE/DELETE: bloqueados
CREATE POLICY "wellbeing_checkins self insert"
  ON public.wellbeing_checkins FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- (sem SELECT/UPDATE/DELETE policies = acesso negado pra clientes)

-- 5) Trigger para calcular composite_score, risk_level e snapshot do unit_id
CREATE OR REPLACE FUNCTION public.tg_wellbeing_compute_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  q record;
  raw_val numeric;
  norm numeric;
  total numeric := 0;
  cnt int := 0;
  composite numeric;
BEGIN
  -- snapshot da unidade do user
  IF NEW.unit_id IS NULL THEN
    SELECT unit_id INTO NEW.unit_id FROM public.profiles WHERE user_id = NEW.user_id;
  END IF;

  -- itera nas perguntas ativas e normaliza respostas
  FOR q IN SELECT id, scale_min, scale_max, reverse_scoring FROM public.wellbeing_questions WHERE active = true LOOP
    raw_val := NULLIF(NEW.responses ->> q.id::text, '')::numeric;
    IF raw_val IS NULL THEN CONTINUE; END IF;
    IF raw_val < q.scale_min THEN raw_val := q.scale_min; END IF;
    IF raw_val > q.scale_max THEN raw_val := q.scale_max; END IF;
    -- normaliza pra "maior = pior" (0..1)
    IF q.reverse_scoring THEN
      norm := (q.scale_max - raw_val) / NULLIF(q.scale_max - q.scale_min, 0);
    ELSE
      norm := (raw_val - q.scale_min) / NULLIF(q.scale_max - q.scale_min, 0);
    END IF;
    total := total + norm;
    cnt := cnt + 1;
  END LOOP;

  IF cnt = 0 THEN
    RAISE EXCEPTION 'Nenhuma resposta válida';
  END IF;

  composite := round((total / cnt) * 100, 2);
  NEW.composite_score := composite;
  NEW.risk_level := CASE
    WHEN composite <= 25 THEN 'ok'
    WHEN composite <= 50 THEN 'atencao'
    WHEN composite <= 75 THEN 'alerta'
    ELSE 'critico'
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_wellbeing_compute_score
  BEFORE INSERT ON public.wellbeing_checkins
  FOR EACH ROW EXECUTE FUNCTION public.tg_wellbeing_compute_score();

-- 6) Helper: usuário já fez check-in no mês corrente?
CREATE OR REPLACE FUNCTION public.fn_my_checkin_done_this_month()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wellbeing_checkins
    WHERE user_id = auth.uid()
      AND date_trunc('month', checkin_date) = date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo')::date)
  )
$$;

-- 7) View agregada (definer; n>=5 anti-deanonimização)
CREATE OR REPLACE VIEW public.v_wellbeing_aggregated
WITH (security_invoker = false) AS
SELECT
  c.unit_id,
  date_trunc('month', c.checkin_date)::date AS month,
  count(*)::int AS count_responses,
  round(avg(c.composite_score)::numeric, 2) AS avg_composite_score,
  round(100.0 * count(*) FILTER (WHERE c.risk_level = 'ok') / count(*), 1) AS pct_ok,
  round(100.0 * count(*) FILTER (WHERE c.risk_level = 'atencao') / count(*), 1) AS pct_atencao,
  round(100.0 * count(*) FILTER (WHERE c.risk_level = 'alerta') / count(*), 1) AS pct_alerta,
  round(100.0 * count(*) FILTER (WHERE c.risk_level = 'critico') / count(*), 1) AS pct_critico
FROM public.wellbeing_checkins c
WHERE c.unit_id IS NOT NULL
GROUP BY c.unit_id, date_trunc('month', c.checkin_date)
HAVING count(*) >= 5;

-- Wrapper RPC com autorização
CREATE OR REPLACE FUNCTION public.fn_wellbeing_aggregated(_unit_id uuid DEFAULT NULL, _from date DEFAULT NULL, _to date DEFAULT NULL)
RETURNS TABLE(unit_id uuid, month date, count_responses int, avg_composite_score numeric, pct_ok numeric, pct_atencao numeric, pct_alerta numeric, pct_critico numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'master')
    OR public.has_role(auth.uid(),'supervisor')
    OR public.is_rh_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  RETURN QUERY
  SELECT v.unit_id, v.month, v.count_responses, v.avg_composite_score, v.pct_ok, v.pct_atencao, v.pct_alerta, v.pct_critico
  FROM public.v_wellbeing_aggregated v
  WHERE (_unit_id IS NULL OR v.unit_id = _unit_id)
    AND (_from IS NULL OR v.month >= _from)
    AND (_to IS NULL OR v.month <= _to)
  ORDER BY v.month DESC, v.unit_id;
END;
$$;

-- 8) Alertas críticos (RH only) — devolve hash, sem PII
CREATE OR REPLACE FUNCTION public.fn_wellbeing_critical_alerts()
RETURNS TABLE(user_hash text, unit_id uuid, risk_level text, created_at timestamptz)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'master')
    OR public.is_rh_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  RETURN QUERY
  SELECT public.wellbeing_hash_user(c.user_id) AS user_hash,
         c.unit_id,
         c.risk_level,
         c.created_at
  FROM public.wellbeing_checkins c
  WHERE c.risk_level = 'critico'
    AND c.created_at >= now() - interval '30 days'
  ORDER BY c.created_at DESC;
END;
$$;

-- 9) Seed perguntas (PHQ-9 simplificado + GAD-2 adaptado, PT-BR)
INSERT INTO public.wellbeing_questions (code, question_text, dimension, reverse_scoring, ordem) VALUES
  ('sono_qualidade', 'Nas últimas 2 semanas, você tem dormido bem?', 'sono', true, 1),
  ('ansiedade_nervosismo', 'Tem se sentido nervoso(a), ansioso(a) ou no limite?', 'ansiedade', false, 2),
  ('ansiedade_preocupacao', 'Tem dificuldade de parar ou controlar as preocupações?', 'ansiedade', false, 3),
  ('energia_diaria', 'Tem se sentido com energia pra encarar o dia a dia?', 'energia', true, 4),
  ('proposito_trabalho', 'Sente que seu trabalho tem propósito e faz sentido pra você?', 'proposito', true, 5),
  ('conflitos_relacionamento', 'Tem enfrentado conflitos difíceis em casa ou no trabalho?', 'conflitos', false, 6),
  ('dinheiro_preocupacao', 'Está preocupado(a) com questões financeiras?', 'dinheiro', false, 7),
  ('suporte_apoio', 'Sente que tem alguém com quem contar quando precisa?', 'suporte', true, 8);
