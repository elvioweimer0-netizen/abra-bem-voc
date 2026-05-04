
-- ============ TABELAS ============
CREATE TABLE public.sales_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  metric_date date NOT NULL,
  metric_hour smallint NULL CHECK (metric_hour IS NULL OR (metric_hour BETWEEN 0 AND 23)),
  revenue numeric(12,2) NOT NULL DEFAULT 0 CHECK (revenue >= 0),
  transactions int NOT NULL DEFAULT 0 CHECK (transactions >= 0),
  ticket_avg numeric(12,2) NULL,
  source text NOT NULL CHECK (source IN ('manual','integracao_pdv','planilha')),
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ux_sales_metrics_slot
  ON public.sales_metrics (unit_id, metric_date, COALESCE(metric_hour, -1));

CREATE INDEX ix_sales_metrics_unit_date
  ON public.sales_metrics (unit_id, metric_date DESC, metric_hour);

CREATE TABLE public.sales_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  year smallint NOT NULL CHECK (year BETWEEN 2024 AND 2100),
  month smallint NOT NULL CHECK (month BETWEEN 1 AND 12),
  target_revenue numeric(14,2) NOT NULL DEFAULT 0 CHECK (target_revenue >= 0),
  target_transactions int NOT NULL DEFAULT 0 CHECK (target_transactions >= 0),
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unit_id, year, month)
);

-- triggers updated_at
CREATE TRIGGER tg_sales_metrics_updated_at
BEFORE UPDATE ON public.sales_metrics
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER tg_sales_targets_updated_at
BEFORE UPDATE ON public.sales_targets
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- trigger: ticket_avg auto
CREATE OR REPLACE FUNCTION public.tg_sales_metrics_ticket_avg()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_avg IS NULL THEN
    IF NEW.transactions > 0 THEN
      NEW.ticket_avg := round(NEW.revenue / NEW.transactions, 2);
    ELSE
      NEW.ticket_avg := 0;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_sales_metrics_ticket
BEFORE INSERT OR UPDATE ON public.sales_metrics
FOR EACH ROW EXECUTE FUNCTION public.tg_sales_metrics_ticket_avg();

-- ============ RLS ============
ALTER TABLE public.sales_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;

-- sales_metrics
CREATE POLICY "sales_metrics_select"
ON public.sales_metrics
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR public.is_unit_manager(auth.uid(), unit_id)
);

CREATE POLICY "sales_metrics_insert"
ON public.sales_metrics
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR public.is_unit_manager(auth.uid(), unit_id)
);

CREATE POLICY "sales_metrics_update"
ON public.sales_metrics
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR public.is_unit_manager(auth.uid(), unit_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR public.is_unit_manager(auth.uid(), unit_id)
);

CREATE POLICY "sales_metrics_delete"
ON public.sales_metrics
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
);

-- sales_targets
CREATE POLICY "sales_targets_select"
ON public.sales_targets
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR public.is_unit_manager(auth.uid(), unit_id)
);

CREATE POLICY "sales_targets_write"
ON public.sales_targets
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
);

-- ============ RPCs ============
CREATE OR REPLACE FUNCTION public.fn_sales_today_summary(_unit_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  _yest date := _today - 1;
  _last_week date := _today - 7;
  _y smallint := extract(year FROM _today)::smallint;
  _m smallint := extract(month FROM _today)::smallint;
  _days_in_month int := extract(day FROM (date_trunc('month', _today) + interval '1 month - 1 day'))::int;
  _day_of_month int := extract(day FROM _today)::int;
  _today_rev numeric := 0;
  _today_tx int := 0;
  _yest_rev numeric := 0;
  _last_week_rev numeric := 0;
  _target_rev numeric := 0;
  _target_tx int := 0;
  _last_updated timestamptz;
BEGIN
  -- autorização: leitura só pra quem pode ver sales_metrics
  IF NOT (
    public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
    OR public.is_unit_manager(auth.uid(), _unit_id)
  ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  SELECT COALESCE(SUM(revenue),0), COALESCE(SUM(transactions),0), MAX(updated_at)
    INTO _today_rev, _today_tx, _last_updated
    FROM public.sales_metrics
   WHERE unit_id = _unit_id AND metric_date = _today;

  SELECT COALESCE(SUM(revenue),0) INTO _yest_rev
    FROM public.sales_metrics
   WHERE unit_id = _unit_id AND metric_date = _yest;

  SELECT COALESCE(SUM(revenue),0) INTO _last_week_rev
    FROM public.sales_metrics
   WHERE unit_id = _unit_id AND metric_date = _last_week;

  SELECT target_revenue, target_transactions
    INTO _target_rev, _target_tx
    FROM public.sales_targets
   WHERE unit_id = _unit_id AND year = _y AND month = _m;

  RETURN jsonb_build_object(
    'date', _today,
    'unit_id', _unit_id,
    'revenue_today', _today_rev,
    'transactions_today', _today_tx,
    'revenue_yesterday', _yest_rev,
    'revenue_last_week_same_dow', _last_week_rev,
    'target_month_revenue', COALESCE(_target_rev,0),
    'target_month_transactions', COALESCE(_target_tx,0),
    'target_today_prorated', CASE WHEN _days_in_month > 0 THEN round(COALESCE(_target_rev,0) * _day_of_month / _days_in_month, 2) ELSE 0 END,
    'target_daily', CASE WHEN _days_in_month > 0 THEN round(COALESCE(_target_rev,0) / _days_in_month, 2) ELSE 0 END,
    'achievement_pct', CASE
      WHEN COALESCE(_target_rev,0) = 0 OR _days_in_month = 0 THEN NULL
      ELSE round((_today_rev / NULLIF(_target_rev / _days_in_month, 0)) * 100, 1)
    END,
    'last_updated_at', _last_updated
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_sales_range(_unit_id uuid, _from date, _to date)
RETURNS TABLE(metric_date date, revenue numeric, transactions int, ticket_avg numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
    OR public.is_unit_manager(auth.uid(), _unit_id)
  ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  RETURN QUERY
  SELECT m.metric_date,
         SUM(m.revenue)::numeric AS revenue,
         SUM(m.transactions)::int AS transactions,
         CASE WHEN SUM(m.transactions) > 0 THEN round(SUM(m.revenue)/SUM(m.transactions), 2) ELSE 0 END AS ticket_avg
    FROM public.sales_metrics m
   WHERE m.unit_id = _unit_id AND m.metric_date BETWEEN _from AND _to
   GROUP BY m.metric_date
   ORDER BY m.metric_date;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_sales_compare_units(_from date, _to date)
RETURNS TABLE(unit_id uuid, unit_name text, revenue numeric, transactions int)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
  ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  RETURN QUERY
  SELECT m.unit_id, u.name, SUM(m.revenue)::numeric, SUM(m.transactions)::int
    FROM public.sales_metrics m
    JOIN public.units u ON u.id = m.unit_id
   WHERE m.metric_date BETWEEN _from AND _to
   GROUP BY m.unit_id, u.name
   ORDER BY SUM(m.revenue) DESC;
END;
$$;
