
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_nascimento date;

ALTER TYPE public.praise_category ADD VALUE IF NOT EXISTS 'aniversario';

CREATE TABLE public.birthday_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  message_text text NOT NULL DEFAULT 'Parabéns! 🎉' CHECK (length(message_text) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX birthday_msg_daily_uidx ON public.birthday_messages
  (from_user_id, to_user_id, ((created_at AT TIME ZONE 'America/Sao_Paulo')::date));
CREATE INDEX birthday_msg_to_idx ON public.birthday_messages (to_user_id, created_at DESC);

ALTER TABLE public.birthday_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View birthday messages" ON public.birthday_messages
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Send own birthday message" ON public.birthday_messages
FOR INSERT TO authenticated WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Delete own birthday message" ON public.birthday_messages
FOR DELETE TO authenticated USING (from_user_id = auth.uid());

CREATE OR REPLACE VIEW public.v_aniversariantes_hoje
WITH (security_invoker = true) AS
SELECT p.user_id, p.nome, p.foto_url, p.cargo, p.cargo_titulo, p.setor, p.unidade,
       extract(day FROM p.data_nascimento)::int   AS dia,
       extract(month FROM p.data_nascimento)::int AS mes
FROM public.profiles p
WHERE p.ativo = true AND p.data_nascimento IS NOT NULL
  AND extract(day FROM p.data_nascimento)   = extract(day FROM (now() AT TIME ZONE 'America/Sao_Paulo'))
  AND extract(month FROM p.data_nascimento) = extract(month FROM (now() AT TIME ZONE 'America/Sao_Paulo'));

CREATE OR REPLACE VIEW public.v_aniversariantes_proximos_7d
WITH (security_invoker = true) AS
SELECT p.user_id, p.nome, p.foto_url, p.cargo, p.cargo_titulo, p.setor, p.unidade,
       extract(day FROM p.data_nascimento)::int   AS dia,
       extract(month FROM p.data_nascimento)::int AS mes,
       ((make_date(extract(year FROM (now() AT TIME ZONE 'America/Sao_Paulo'))::int,
                   extract(month FROM p.data_nascimento)::int,
                   extract(day FROM p.data_nascimento)::int)
        - (now() AT TIME ZONE 'America/Sao_Paulo')::date) + 365) % 365 AS days_ahead
FROM public.profiles p
WHERE p.ativo = true AND p.data_nascimento IS NOT NULL;

CREATE OR REPLACE FUNCTION public.notify_birthday_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _from_name text;
BEGIN
  IF NEW.from_user_id = NEW.to_user_id THEN RETURN NEW; END IF;
  SELECT nome INTO _from_name FROM public.profiles WHERE user_id = NEW.from_user_id;
  INSERT INTO public.notification_events (type, title, body, recipient_user_id, payload)
  VALUES ('birthday_wish',
          'Feliz aniversário! 🎉',
          COALESCE(_from_name, 'Alguém') || ' te parabenizou pelo aniversário',
          NEW.to_user_id,
          jsonb_build_object('from_user_id', NEW.from_user_id, 'message_id', NEW.id));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_birthday_message
AFTER INSERT ON public.birthday_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_birthday_message();
