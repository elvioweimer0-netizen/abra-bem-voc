DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_type') THEN
    CREATE TYPE public.meeting_type AS ENUM ('diaria', 'semanal', 'individual');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_status') THEN
    CREATE TYPE public.meeting_status AS ENUM ('agendada', 'em_andamento', 'encerrada', 'cancelada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agenda_item_type') THEN
    CREATE TYPE public.agenda_item_type AS ENUM ('bo', 'informativo', 'venda', 'meta', 'performance', 'quebra', 'livre', 'convidado', 'decisao');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_event_type') THEN
    CREATE TYPE public.notification_event_type AS ENUM ('meeting_reminder', 'checklist_pending', 'checklist_closing', 'high_occurrence', 'weekly_report', 'meeting_minutes');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.leadership_meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type public.meeting_type NOT NULL,
  unit_id uuid REFERENCES public.units(id),
  scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
  scheduled_time time NOT NULL,
  is_monthly_in_person boolean NOT NULL DEFAULT false,
  status public.meeting_status NOT NULL DEFAULT 'agendada',
  title text NOT NULL,
  agenda jsonb NOT NULL DEFAULT '[]'::jsonb,
  decisions text,
  minutes text,
  created_by uuid,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meeting_attendees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES public.leadership_meetings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role_label text,
  present boolean NOT NULL DEFAULT false,
  auto_replaced_by uuid,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.meeting_agenda_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES public.leadership_meetings(id) ON DELETE CASCADE,
  user_id uuid,
  unit_id uuid REFERENCES public.units(id),
  type public.agenda_item_type NOT NULL DEFAULT 'livre',
  title text NOT NULL,
  content text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.occurrence_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  occurrence_id uuid NOT NULL REFERENCES public.leadership_occurrences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type public.notification_event_type NOT NULL,
  recipient_user_id uuid,
  unit_id uuid REFERENCES public.units(id),
  title text NOT NULL,
  body text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leadership_occurrences
  ADD COLUMN IF NOT EXISTS comments_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.is_leadership(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
    OR public.has_role(_user_id, 'master')
    OR public.has_role(_user_id, 'supervisor')
    OR public.has_role(_user_id, 'gerente')
    OR public.has_role(_user_id, 'gerente_loja')
    OR public.has_role(_user_id, 'encarregado')
    OR public.has_role(_user_id, 'lider')
$$;

ALTER TABLE public.leadership_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occurrence_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leadership can view meetings" ON public.leadership_meetings;
CREATE POLICY "Leadership can view meetings" ON public.leadership_meetings FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) AND (unit_id IS NULL OR public.user_can_access_unit(auth.uid(), unit_id)));
DROP POLICY IF EXISTS "Leadership can create meetings" ON public.leadership_meetings;
CREATE POLICY "Leadership can create meetings" ON public.leadership_meetings FOR INSERT TO authenticated
WITH CHECK ((created_by = auth.uid() OR created_by IS NULL) AND public.is_leadership(auth.uid()) AND (unit_id IS NULL OR public.user_can_access_unit(auth.uid(), unit_id)));
DROP POLICY IF EXISTS "Leadership can update meetings" ON public.leadership_meetings;
CREATE POLICY "Leadership can update meetings" ON public.leadership_meetings FOR UPDATE TO authenticated
USING (public.is_leadership(auth.uid()) AND (unit_id IS NULL OR public.user_can_access_unit(auth.uid(), unit_id)))
WITH CHECK (public.is_leadership(auth.uid()) AND (unit_id IS NULL OR public.user_can_access_unit(auth.uid(), unit_id)));

DROP POLICY IF EXISTS "Leadership can view attendees" ON public.meeting_attendees;
CREATE POLICY "Leadership can view attendees" ON public.meeting_attendees FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.leadership_meetings m WHERE m.id = meeting_id AND (m.unit_id IS NULL OR public.user_can_access_unit(auth.uid(), m.unit_id))));
DROP POLICY IF EXISTS "Leadership can manage own attendance" ON public.meeting_attendees;
CREATE POLICY "Leadership can manage own attendance" ON public.meeting_attendees FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor'));

DROP POLICY IF EXISTS "Leadership can view agenda" ON public.meeting_agenda_items;
CREATE POLICY "Leadership can view agenda" ON public.meeting_agenda_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.leadership_meetings m WHERE m.id = meeting_id AND (m.unit_id IS NULL OR public.user_can_access_unit(auth.uid(), m.unit_id))));
DROP POLICY IF EXISTS "Leadership can manage agenda" ON public.meeting_agenda_items;
CREATE POLICY "Leadership can manage agenda" ON public.meeting_agenda_items FOR ALL TO authenticated
USING ((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor'))
WITH CHECK (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor')) AND (unit_id IS NULL OR public.user_can_access_unit(auth.uid(), unit_id)));

DROP POLICY IF EXISTS "Leadership can view occurrence comments" ON public.occurrence_comments;
CREATE POLICY "Leadership can view occurrence comments" ON public.occurrence_comments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.leadership_occurrences o WHERE o.id = occurrence_id AND public.user_can_access_unit(auth.uid(), o.unit_id)));
DROP POLICY IF EXISTS "Leadership can create occurrence comments" ON public.occurrence_comments;
CREATE POLICY "Leadership can create occurrence comments" ON public.occurrence_comments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.leadership_occurrences o WHERE o.id = occurrence_id AND public.user_can_access_unit(auth.uid(), o.unit_id)));

DROP POLICY IF EXISTS "Users view own notifications" ON public.notification_events;
CREATE POLICY "Users view own notifications" ON public.notification_events FOR SELECT TO authenticated
USING (recipient_user_id = auth.uid() OR (unit_id IS NOT NULL AND public.user_can_access_unit(auth.uid(), unit_id)) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor'));
DROP POLICY IF EXISTS "Leadership can create notifications" ON public.notification_events;
CREATE POLICY "Leadership can create notifications" ON public.notification_events FOR INSERT TO authenticated
WITH CHECK (public.is_leadership(auth.uid()));
DROP POLICY IF EXISTS "System updates notifications" ON public.notification_events;
CREATE POLICY "System updates notifications" ON public.notification_events FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor'));

CREATE OR REPLACE FUNCTION public.enqueue_high_occurrence_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.gravidade = 'alta' THEN
    INSERT INTO public.notification_events (type, unit_id, title, body, payload)
    VALUES ('high_occurrence', NEW.unit_id, 'B.O. grave registrado', left(NEW.descricao, 180), jsonb_build_object('occurrence_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_occurrence_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leadership_occurrences SET comments_count = comments_count + 1 WHERE id = NEW.occurrence_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_high_occurrence_notification ON public.leadership_occurrences;
CREATE TRIGGER trigger_high_occurrence_notification AFTER INSERT ON public.leadership_occurrences FOR EACH ROW EXECUTE FUNCTION public.enqueue_high_occurrence_notification();
DROP TRIGGER IF EXISTS trigger_occurrence_comment_count ON public.occurrence_comments;
CREATE TRIGGER trigger_occurrence_comment_count AFTER INSERT ON public.occurrence_comments FOR EACH ROW EXECUTE FUNCTION public.increment_occurrence_comments_count();
DROP TRIGGER IF EXISTS update_leadership_meetings_updated_at ON public.leadership_meetings;
CREATE TRIGGER update_leadership_meetings_updated_at BEFORE UPDATE ON public.leadership_meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_meetings_date_type ON public.leadership_meetings(scheduled_date, type, unit_id);
CREATE INDEX IF NOT EXISTS idx_attendees_meeting ON public.meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_agenda_meeting ON public.meeting_agenda_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_occurrence_comments_occurrence ON public.occurrence_comments(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_pending ON public.notification_events(sent_at, type, created_at);

INSERT INTO public.leadership_meetings (type, unit_id, scheduled_date, scheduled_time, title, created_by)
SELECT 'diaria', NULL, CURRENT_DATE, '09:30', 'Reunião Diária', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.leadership_meetings WHERE type = 'diaria' AND scheduled_date = CURRENT_DATE);

INSERT INTO public.leadership_meetings (type, unit_id, scheduled_date, scheduled_time, title, is_monthly_in_person, created_by)
SELECT 'individual', u.id, CURRENT_DATE, s.meeting_time::time, 'Individual - ' || u.name, (EXTRACT(day FROM CURRENT_DATE)::int <= 7), NULL
FROM (VALUES
  ('L03', '15:00'),
  ('L01', '15:30'),
  ('CP', '08:00'),
  ('L04', '15:00'),
  ('L05', '15:30')
) AS s(code, meeting_time)
JOIN public.units u ON u.code = s.code
WHERE NOT EXISTS (SELECT 1 FROM public.leadership_meetings m WHERE m.type = 'individual' AND m.unit_id = u.id AND m.scheduled_date = CURRENT_DATE);