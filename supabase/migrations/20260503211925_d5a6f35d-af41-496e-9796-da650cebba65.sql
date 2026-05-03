
-- Tables
CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  question text NOT NULL CHECK (length(question) BETWEEN 5 AND 200),
  options jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  target_roles text[] NOT NULL DEFAULT '{}',
  allow_anonymous boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa','encerrada','cancelada')),
  notified_30min boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_polls_status_expires ON public.polls(status, expires_at);
CREATE INDEX idx_polls_author ON public.polls(author_user_id);

CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  option_id text NOT NULL,
  voted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);
CREATE INDEX idx_poll_votes_poll ON public.poll_votes(poll_id);

-- Validation trigger for options (2-4 with id+label)
CREATE OR REPLACE FUNCTION public.tg_polls_validate_options()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n int; o jsonb;
BEGIN
  IF jsonb_typeof(NEW.options) <> 'array' THEN
    RAISE EXCEPTION 'options precisa ser array';
  END IF;
  n := jsonb_array_length(NEW.options);
  IF n < 2 OR n > 4 THEN
    RAISE EXCEPTION 'A enquete precisa ter entre 2 e 4 opções';
  END IF;
  FOR o IN SELECT * FROM jsonb_array_elements(NEW.options) LOOP
    IF (o->>'id') IS NULL OR length(o->>'id') = 0
       OR (o->>'label') IS NULL OR length(o->>'label') = 0 THEN
      RAISE EXCEPTION 'Cada opção precisa ter id e label';
    END IF;
  END LOOP;
  IF NEW.expires_at <= now() THEN
    RAISE EXCEPTION 'expires_at precisa ser futuro';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_polls_validate BEFORE INSERT OR UPDATE ON public.polls
FOR EACH ROW EXECUTE FUNCTION public.tg_polls_validate_options();

CREATE TRIGGER trg_polls_updated_at BEFORE UPDATE ON public.polls
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Eligibility helper
CREATE OR REPLACE FUNCTION public.is_eligible_for_poll(_uid uuid, _poll_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.polls pl
    JOIN public.profiles p ON p.user_id = _uid
    WHERE pl.id = _poll_id
      AND (
        pl.author_user_id = _uid
        OR public.has_role(_uid,'admin'::cargo_tipo)
        OR public.has_role(_uid,'master'::cargo_tipo)
        OR (
          (cardinality(pl.target_roles) = 0 OR p.cargo::text = ANY(pl.target_roles))
          AND (pl.unit_id IS NULL OR pl.unit_id = p.unit_id OR pl.unit_id = ANY(COALESCE(p.permission_units,'{}')))
        )
      )
  )
$$;

-- Notify on creation
CREATE OR REPLACE FUNCTION public.tg_polls_notify_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; _author text;
BEGIN
  SELECT nome INTO _author FROM public.profiles WHERE user_id = NEW.author_user_id;
  FOR r IN
    SELECT p.user_id FROM public.profiles p
    WHERE p.ativo = true AND p.user_id IS NOT NULL AND p.user_id <> NEW.author_user_id
      AND (NEW.unit_id IS NULL OR p.unit_id = NEW.unit_id OR NEW.unit_id = ANY(COALESCE(p.permission_units,'{}')))
      AND (cardinality(NEW.target_roles) = 0 OR p.cargo::text = ANY(NEW.target_roles))
  LOOP
    INSERT INTO public.notification_events (type, recipient_user_id, unit_id, title, body, payload)
    VALUES ('poll_created', r.user_id, NEW.unit_id, 'Nova enquete rápida',
            COALESCE(_author,'Liderança') || ' quer sua opinião: ' || NEW.question,
            jsonb_build_object('poll_id', NEW.id));
  END LOOP;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_polls_notify_created AFTER INSERT ON public.polls
FOR EACH ROW WHEN (NEW.status = 'ativa') EXECUTE FUNCTION public.tg_polls_notify_created();

-- RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "polls_select_eligible" ON public.polls FOR SELECT TO authenticated
USING (
  author_user_id = auth.uid()
  OR has_role(auth.uid(),'admin'::cargo_tipo)
  OR has_role(auth.uid(),'master'::cargo_tipo)
  OR public.is_eligible_for_poll(auth.uid(), id)
);

CREATE POLICY "polls_insert_leaders" ON public.polls FOR INSERT TO authenticated
WITH CHECK (
  author_user_id = auth.uid() AND (
    has_role(auth.uid(),'admin'::cargo_tipo) OR
    has_role(auth.uid(),'master'::cargo_tipo) OR
    has_role(auth.uid(),'supervisor'::cargo_tipo) OR
    has_role(auth.uid(),'gerente'::cargo_tipo) OR
    has_role(auth.uid(),'gerente_loja'::cargo_tipo) OR
    has_role(auth.uid(),'gerente_adm'::cargo_tipo) OR
    has_role(auth.uid(),'encarregado'::cargo_tipo)
  )
);

CREATE POLICY "polls_update_author" ON public.polls FOR UPDATE TO authenticated
USING (author_user_id = auth.uid() OR has_role(auth.uid(),'admin'::cargo_tipo) OR has_role(auth.uid(),'master'::cargo_tipo));

CREATE POLICY "polls_delete_author" ON public.polls FOR DELETE TO authenticated
USING (author_user_id = auth.uid() OR has_role(auth.uid(),'admin'::cargo_tipo) OR has_role(auth.uid(),'master'::cargo_tipo));

CREATE POLICY "poll_votes_insert_self" ON public.poll_votes FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.polls pl
    WHERE pl.id = poll_id AND pl.status = 'ativa' AND pl.expires_at > now()
  )
  AND public.is_eligible_for_poll(auth.uid(), poll_id)
);

CREATE POLICY "poll_votes_select" ON public.poll_votes FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.polls pl WHERE pl.id = poll_id AND pl.author_user_id = auth.uid())
  OR has_role(auth.uid(),'admin'::cargo_tipo)
  OR has_role(auth.uid(),'master'::cargo_tipo)
);
