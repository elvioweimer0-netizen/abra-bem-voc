
-- Stories table
CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id uuid NOT NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  setor text,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image','video')),
  caption text CHECK (caption IS NULL OR length(caption) <= 200),
  duration_seconds int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX idx_stories_unit_expires ON public.stories(unit_id, expires_at DESC);
CREATE INDEX idx_stories_author_created ON public.stories(author_user_id, created_at DESC);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stories insert leaders only"
ON public.stories FOR INSERT TO authenticated
WITH CHECK (
  author_user_id = auth.uid()
  AND (
    public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
    OR public.has_role(auth.uid(), 'gerente_loja'::cargo_tipo)
    OR public.has_role(auth.uid(), 'gerente_adm'::cargo_tipo)
    OR public.has_role(auth.uid(), 'encarregado'::cargo_tipo)
    OR public.has_role(auth.uid(), 'fiscal'::cargo_tipo)
    OR public.has_role(auth.uid(), 'lider_setor'::cargo_tipo)
  )
);

CREATE POLICY "stories select active by unit"
ON public.stories FOR SELECT TO authenticated
USING (expires_at > now() AND public.user_can_access_unit(auth.uid(), unit_id));

CREATE POLICY "stories select own author"
ON public.stories FOR SELECT TO authenticated
USING (author_user_id = auth.uid());

CREATE POLICY "stories update author within 5 min"
ON public.stories FOR UPDATE TO authenticated
USING (author_user_id = auth.uid() AND created_at > now() - interval '5 minutes')
WITH CHECK (author_user_id = auth.uid());

CREATE POLICY "stories delete author or admin"
ON public.stories FOR DELETE TO authenticated
USING (
  author_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  OR public.has_role(auth.uid(), 'master'::cargo_tipo)
);

-- Anti-spam trigger
CREATE OR REPLACE FUNCTION public.tg_stories_daily_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.stories
      WHERE author_user_id = NEW.author_user_id
        AND created_at > now() - interval '24 hours') >= 10 THEN
    RAISE EXCEPTION 'Limite diário de 10 stories atingido';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER stories_daily_limit
BEFORE INSERT ON public.stories
FOR EACH ROW EXECUTE FUNCTION public.tg_stories_daily_limit();

-- Notification trigger (silent)
CREATE OR REPLACE FUNCTION public.tg_stories_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _author_name text;
  recipient record;
BEGIN
  SELECT nome INTO _author_name FROM public.profiles WHERE user_id = NEW.author_user_id;
  FOR recipient IN
    SELECT user_id FROM public.profiles
    WHERE unit_id = NEW.unit_id AND ativo = true AND user_id IS NOT NULL AND user_id <> NEW.author_user_id
  LOOP
    INSERT INTO public.notification_events (type, title, body, recipient_user_id, unit_id, payload)
    VALUES ('new_story',
            'Novo story',
            COALESCE(_author_name,'Alguém') || ' publicou um story',
            recipient.user_id,
            NEW.unit_id,
            jsonb_build_object('story_id', NEW.id, 'author_user_id', NEW.author_user_id));
  END LOOP;
  RETURN NEW;
END;
$$;
CREATE TRIGGER stories_notify_unit
AFTER INSERT ON public.stories
FOR EACH ROW EXECUTE FUNCTION public.tg_stories_notify();

-- Story views
CREATE TABLE public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_user_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, viewer_user_id)
);
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_views insert self"
ON public.story_views FOR INSERT TO authenticated
WITH CHECK (viewer_user_id = auth.uid());

CREATE POLICY "story_views select self or author"
ON public.story_views FOR SELECT TO authenticated
USING (
  viewer_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.author_user_id = auth.uid())
);

-- Story reactions
CREATE TABLE public.story_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL CHECK (emoji IN ('👏','❤️','🎉','👍','🔥')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id, emoji)
);
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_reactions insert self"
ON public.story_reactions FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = story_id
      AND (s.expires_at > now() AND public.user_can_access_unit(auth.uid(), s.unit_id))
  )
);

CREATE POLICY "story_reactions select if access"
ON public.story_reactions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = story_id
      AND (s.author_user_id = auth.uid() OR public.user_can_access_unit(auth.uid(), s.unit_id))
  )
);

CREATE POLICY "story_reactions delete self"
ON public.story_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('stories', 'stories', false, 52428800,
        ARRAY['image/jpeg','image/png','image/webp','video/mp4'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "stories bucket insert by owner path"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'stories'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "stories bucket select authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'stories');

CREATE POLICY "stories bucket delete owner or admin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'stories'
  AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  )
);
