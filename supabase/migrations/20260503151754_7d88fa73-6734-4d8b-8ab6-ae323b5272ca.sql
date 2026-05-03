
-- Tabela principal
CREATE TABLE public.curio_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  value_id uuid NULL REFERENCES public.culture_values(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 100),
  content text NOT NULL CHECK (char_length(content) BETWEEN 30 AND 1500),
  image_url text NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','rejeitada','arquivada')),
  moderated_by uuid NULL REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  moderated_at timestamptz NULL,
  moderation_note text NULL,
  published_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_curio_stories_status_pub ON public.curio_stories(status, published_at DESC);
CREATE INDEX idx_curio_stories_author ON public.curio_stories(author_user_id);
CREATE INDEX idx_curio_stories_value ON public.curio_stories(value_id);

-- Tabela curtidas
CREATE TABLE public.curio_story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.curio_stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  liked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

CREATE INDEX idx_curio_story_likes_story ON public.curio_story_likes(story_id);

-- Trigger updated_at
CREATE TRIGGER trg_curio_stories_updated
BEFORE UPDATE ON public.curio_stories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: força status pendente em INSERT
CREATE OR REPLACE FUNCTION public.tg_curio_story_force_pending()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.status := 'pendente';
  NEW.moderated_by := NULL;
  NEW.moderated_at := NULL;
  NEW.moderation_note := NULL;
  NEW.published_at := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_curio_story_force_pending
BEFORE INSERT ON public.curio_stories
FOR EACH ROW EXECUTE FUNCTION public.tg_curio_story_force_pending();

-- Trigger: notifica moderadores ao submeter
CREATE OR REPLACE FUNCTION public.tg_curio_story_notify_moderators()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _author_name text;
  recipient record;
BEGIN
  SELECT nome INTO _author_name FROM public.profiles WHERE user_id = NEW.author_user_id;
  FOR recipient IN
    SELECT DISTINCT p.user_id FROM public.profiles p
    WHERE p.user_id IS NOT NULL AND p.ativo = true
      AND public.is_rh_or_admin(p.user_id)
  LOOP
    INSERT INTO public.notification_events (type, title, body, recipient_user_id, payload)
    VALUES ('story_submitted',
            'Nova história pra moderar',
            COALESCE(_author_name,'Alguém') || ' enviou: ' || NEW.title,
            recipient.user_id,
            jsonb_build_object('story_id', NEW.id));
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_curio_story_notify_moderators
AFTER INSERT ON public.curio_stories
FOR EACH ROW EXECUTE FUNCTION public.tg_curio_story_notify_moderators();

-- Trigger: ao mudar status, notifica autor + seta published_at
CREATE OR REPLACE FUNCTION public.tg_curio_story_on_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'aprovada' THEN
    NEW.published_at := COALESCE(NEW.published_at, now());
    NEW.moderated_at := now();
    INSERT INTO public.notification_events (type, title, body, recipient_user_id, payload)
    VALUES ('story_approved',
            'Sua história foi publicada! 🎉',
            'Confira: ' || NEW.title,
            NEW.author_user_id,
            jsonb_build_object('story_id', NEW.id));
  ELSIF NEW.status = 'rejeitada' THEN
    NEW.moderated_at := now();
    INSERT INTO public.notification_events (type, title, body, recipient_user_id, payload)
    VALUES ('story_rejected',
            'Sua história precisa de ajustes',
            COALESCE(NEW.moderation_note, 'Veja o motivo no painel.'),
            NEW.author_user_id,
            jsonb_build_object('story_id', NEW.id, 'note', NEW.moderation_note));
  ELSIF NEW.status = 'arquivada' THEN
    NEW.moderated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_curio_story_on_status_change
BEFORE UPDATE OF status ON public.curio_stories
FOR EACH ROW EXECUTE FUNCTION public.tg_curio_story_on_status_change();

-- RLS curio_stories
ALTER TABLE public.curio_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stories_insert_self"
ON public.curio_stories FOR INSERT
TO authenticated
WITH CHECK (author_user_id = auth.uid());

CREATE POLICY "stories_select_visible"
ON public.curio_stories FOR SELECT
TO authenticated
USING (
  status = 'aprovada'
  OR author_user_id = auth.uid()
  OR public.is_rh_or_admin(auth.uid())
);

CREATE POLICY "stories_update_author_pending"
ON public.curio_stories FOR UPDATE
TO authenticated
USING (author_user_id = auth.uid() AND status = 'pendente')
WITH CHECK (author_user_id = auth.uid() AND status = 'pendente');

CREATE POLICY "stories_update_moderator"
ON public.curio_stories FOR UPDATE
TO authenticated
USING (public.is_rh_or_admin(auth.uid()))
WITH CHECK (public.is_rh_or_admin(auth.uid()));

-- RLS curio_story_likes
ALTER TABLE public.curio_story_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_likes_select_all"
ON public.curio_story_likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "story_likes_insert_self"
ON public.curio_story_likes FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.curio_stories s
    WHERE s.id = story_id AND s.status = 'aprovada'
  )
);

CREATE POLICY "story_likes_delete_self"
ON public.curio_story_likes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('curio-stories', 'curio-stories', false, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "curio_stories_read_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'curio-stories');

CREATE POLICY "curio_stories_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'curio-stories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "curio_stories_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'curio-stories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "curio_stories_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'curio-stories' AND auth.uid()::text = (storage.foldername(name))[1]);
