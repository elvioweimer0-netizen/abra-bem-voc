
-- Extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- TABLE: missing_product_requests
-- ============================================
CREATE TABLE IF NOT EXISTS public.missing_product_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registered_by_user_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id),
  product_name text NOT NULL,
  brand text NULL,
  category text NULL,
  customer_count int NOT NULL DEFAULT 1,
  priority_score numeric NOT NULL DEFAULT 0,
  notes text NULL,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_compras','adicionado','recusado')),
  status_changed_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  status_changed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mpr_status_priority
  ON public.missing_product_requests(status, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_mpr_unit_created
  ON public.missing_product_requests(unit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mpr_name_trgm
  ON public.missing_product_requests USING gin (product_name gin_trgm_ops);

ALTER TABLE public.missing_product_requests ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_mpr_updated_at
BEFORE UPDATE ON public.missing_product_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABLE: missing_product_upvotes
-- ============================================
CREATE TABLE IF NOT EXISTS public.missing_product_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.missing_product_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  upvoted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_mpu_request ON public.missing_product_upvotes(request_id);
CREATE INDEX IF NOT EXISTS idx_mpu_user ON public.missing_product_upvotes(user_id);

ALTER TABLE public.missing_product_upvotes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS: missing_product_requests
-- ============================================
CREATE POLICY "Authenticated view missing products"
ON public.missing_product_requests FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated insert missing products"
ON public.missing_product_requests FOR INSERT TO authenticated
WITH CHECK (
  registered_by_user_id = public.coverage_profile_id_for(auth.uid())
);

CREATE POLICY "Buyers update missing products"
ON public.missing_product_requests FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR has_role(auth.uid(), 'gerente_adm'::cargo_tipo)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR has_role(auth.uid(), 'gerente_adm'::cargo_tipo)
);

CREATE POLICY "Admins delete missing products"
ON public.missing_product_requests FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
);

-- ============================================
-- RLS: missing_product_upvotes
-- ============================================
CREATE POLICY "Authenticated view upvotes"
ON public.missing_product_upvotes FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users insert own upvote"
ON public.missing_product_upvotes FOR INSERT TO authenticated
WITH CHECK (user_id = public.coverage_profile_id_for(auth.uid()));

CREATE POLICY "Users delete own upvote"
ON public.missing_product_upvotes FOR DELETE TO authenticated
USING (
  user_id = public.coverage_profile_id_for(auth.uid())
  OR has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
);

-- ============================================
-- FUNCTION: fuzzy search
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_search_missing_products(_query text, _limit int DEFAULT 5)
RETURNS TABLE (
  id uuid,
  product_name text,
  brand text,
  category text,
  customer_count int,
  status text,
  similarity real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.product_name, r.brand, r.category, r.customer_count, r.status,
         similarity(r.product_name, _query) AS similarity
    FROM public.missing_product_requests r
   WHERE _query IS NOT NULL
     AND length(trim(_query)) >= 2
     AND similarity(r.product_name, _query) > 0.3
     AND r.status IN ('aberto','em_compras')
   ORDER BY similarity DESC, r.customer_count DESC
   LIMIT GREATEST(1, LEAST(20, _limit));
$$;

-- ============================================
-- TRIGGER: status auto-fill
-- ============================================
CREATE OR REPLACE FUNCTION public.tg_mpr_status_autofill()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at := now();
    IF NEW.status_changed_by IS NULL THEN
      NEW.status_changed_by := public.coverage_profile_id_for(auth.uid());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_mpr_status_autofill
BEFORE UPDATE ON public.missing_product_requests
FOR EACH ROW EXECUTE FUNCTION public.tg_mpr_status_autofill();

-- ============================================
-- TRIGGER: auto upvote registrant
-- ============================================
CREATE OR REPLACE FUNCTION public.tg_mpr_autoupvote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.registered_by_user_id IS NOT NULL THEN
    INSERT INTO public.missing_product_upvotes (request_id, user_id)
    VALUES (NEW.id, NEW.registered_by_user_id)
    ON CONFLICT (request_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_mpr_autoupvote
AFTER INSERT ON public.missing_product_requests
FOR EACH ROW EXECUTE FUNCTION public.tg_mpr_autoupvote();

-- ============================================
-- TRIGGER: recount votes + recompute priority
-- ============================================
CREATE OR REPLACE FUNCTION public.tg_mpu_recount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _request_id uuid;
  _votes int;
  _created timestamptz;
  _days numeric;
  _recency numeric;
BEGIN
  _request_id := COALESCE(NEW.request_id, OLD.request_id);

  SELECT count(*) INTO _votes
    FROM public.missing_product_upvotes
   WHERE request_id = _request_id;

  SELECT created_at INTO _created
    FROM public.missing_product_requests
   WHERE id = _request_id;

  IF _created IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  _days := EXTRACT(EPOCH FROM (now() - _created)) / 86400.0;
  _recency := GREATEST(0, 30 - _days);

  UPDATE public.missing_product_requests
     SET customer_count = GREATEST(1, _votes),
         priority_score = (GREATEST(1, _votes) * 10) + _recency
   WHERE id = _request_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER tg_mpu_recount_ins
AFTER INSERT ON public.missing_product_upvotes
FOR EACH ROW EXECUTE FUNCTION public.tg_mpu_recount();

CREATE TRIGGER tg_mpu_recount_del
AFTER DELETE ON public.missing_product_upvotes
FOR EACH ROW EXECUTE FUNCTION public.tg_mpu_recount();

-- ============================================
-- TRIGGER: notify on "adicionado"
-- ============================================
CREATE OR REPLACE FUNCTION public.tg_mpr_status_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  IF NEW.status = 'adicionado' AND OLD.status IS DISTINCT FROM 'adicionado' THEN
    -- registrante
    IF NEW.registered_by_user_id IS NOT NULL THEN
      FOR r IN
        SELECT user_id FROM public.profiles WHERE id = NEW.registered_by_user_id
      LOOP
        INSERT INTO public.notification_events
          (type, recipient_user_id, unit_id, title, body, payload, grouping_key)
        VALUES (
          'high_occurrence'::notification_event_type,
          r.user_id,
          NEW.unit_id,
          'Produto adicionado ao mix!',
          '"' || NEW.product_name || '" foi atendido pela equipe de compras.',
          jsonb_build_object('request_id', NEW.id, 'product_name', NEW.product_name),
          'missing_product_added:' || NEW.id::text
        );
      END LOOP;
    END IF;

    -- todos que upvotaram
    FOR r IN
      SELECT DISTINCT p.user_id
        FROM public.missing_product_upvotes u
        JOIN public.profiles p ON p.id = u.user_id
       WHERE u.request_id = NEW.id
         AND p.id <> COALESCE(NEW.registered_by_user_id, '00000000-0000-0000-0000-000000000000'::uuid)
    LOOP
      INSERT INTO public.notification_events
        (type, recipient_user_id, unit_id, title, body, payload, grouping_key)
      VALUES (
        'high_occurrence'::notification_event_type,
        r.user_id,
        NEW.unit_id,
        'Produto que você pediu chegou!',
        '"' || NEW.product_name || '" foi adicionado ao mix.',
        jsonb_build_object('request_id', NEW.id, 'product_name', NEW.product_name),
        'missing_product_added:' || NEW.id::text || ':' || r.user_id::text
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_mpr_status_notify
AFTER UPDATE ON public.missing_product_requests
FOR EACH ROW EXECUTE FUNCTION public.tg_mpr_status_notify();
