
CREATE TABLE public.curiozinho_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  briefing_date date NOT NULL,
  content_markdown text NOT NULL,
  alerts jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  data_snapshot jsonb,
  opened_at timestamptz,
  helpful boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, briefing_date)
);

CREATE INDEX idx_curiozinho_briefings_user_date ON public.curiozinho_briefings (user_id, briefing_date DESC);

ALTER TABLE public.curiozinho_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own briefings"
  ON public.curiozinho_briefings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users update own briefing feedback"
  ON public.curiozinho_briefings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger: bloqueia alteração de qualquer campo exceto opened_at/helpful pelos próprios users
CREATE OR REPLACE FUNCTION public.tg_briefing_user_update_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id <> OLD.user_id
    OR NEW.briefing_date <> OLD.briefing_date
    OR NEW.content_markdown <> OLD.content_markdown
    OR NEW.alerts::text <> OLD.alerts::text
    OR NEW.suggestions::text <> OLD.suggestions::text
    OR COALESCE(NEW.data_snapshot::text,'') <> COALESCE(OLD.data_snapshot::text,'')
  THEN
    RAISE EXCEPTION 'Apenas opened_at e helpful podem ser alterados';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_briefing_user_update_guard
  BEFORE UPDATE ON public.curiozinho_briefings
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_briefing_user_update_guard();
