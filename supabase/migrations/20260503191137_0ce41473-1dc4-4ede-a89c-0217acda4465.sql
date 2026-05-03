
ALTER TABLE public.notification_events ADD COLUMN IF NOT EXISTS grouping_key text;
CREATE INDEX IF NOT EXISTS idx_ne_user_group ON public.notification_events(recipient_user_id, grouping_key, created_at DESC);

CREATE OR REPLACE FUNCTION public.fn_notification_grouping_key(_type text, _payload jsonb)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT coalesce(
    _payload->>'aviso_id',
    _payload->>'occurrence_id',
    _payload->>'goal_id',
    _payload->>'story_id',
    _payload->>'meeting_id',
    _payload->>'journey_id',
    _payload->>'comment_id',
    ''
  ) || ':' || coalesce(_type, '');
$$;

CREATE OR REPLACE FUNCTION public.tg_notification_events_grouping_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.grouping_key IS NULL THEN
    NEW.grouping_key := public.fn_notification_grouping_key(NEW.type::text, NEW.payload);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notification_events_grouping_key ON public.notification_events;
CREATE TRIGGER trg_notification_events_grouping_key
  BEFORE INSERT ON public.notification_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_notification_events_grouping_key();

UPDATE public.notification_events
SET grouping_key = public.fn_notification_grouping_key(type::text, payload)
WHERE grouping_key IS NULL;

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS group_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS digest_frequency text NOT NULL DEFAULT 'realtime';

DO $$ BEGIN
  ALTER TABLE public.notification_preferences
    ADD CONSTRAINT notification_preferences_digest_frequency_check
    CHECK (digest_frequency IN ('realtime','hourly','every_4h','daily'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE VIEW public.notification_groups
WITH (security_invoker = true) AS
SELECT
  recipient_user_id AS user_id,
  grouping_key,
  (array_agg(type ORDER BY created_at DESC))[1] AS type,
  (array_agg(title ORDER BY created_at DESC))[1] AS sample_title,
  (array_agg(body  ORDER BY created_at DESC))[1] AS sample_body,
  (array_agg(payload ORDER BY created_at DESC))[1] AS sample_payload,
  (array_agg(unit_id ORDER BY created_at DESC))[1] AS unit_id,
  count(*)::int AS event_count,
  max(created_at) AS latest_at,
  min(created_at) AS earliest_at,
  count(*) FILTER (WHERE sent_at IS NULL)::int AS unread_count
FROM public.notification_events
WHERE recipient_user_id IS NOT NULL
  AND created_at >= now() - interval '4 hours'
  AND grouping_key IS NOT NULL
GROUP BY recipient_user_id, grouping_key;
