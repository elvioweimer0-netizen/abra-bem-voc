
-- Helper
CREATE OR REPLACE FUNCTION public.can_view_aviso(_user uuid, _aviso uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.avisos a
    WHERE a.id = _aviso
      AND (a.unidade IS NULL
           OR public.has_role(_user, 'admin'::cargo_tipo)
           OR public.has_role(_user, 'master'::cargo_tipo)
           OR a.unidade = public.get_user_unidade(_user))
  )
$$;

-- aviso_reactions
CREATE TABLE public.aviso_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aviso_id uuid NOT NULL REFERENCES public.avisos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL CHECK (emoji IN ('👍','❤️','😊','⚠️','🙏')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (aviso_id, user_id, emoji)
);
CREATE INDEX idx_aviso_reactions_aviso ON public.aviso_reactions(aviso_id);

ALTER TABLE public.aviso_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View reactions" ON public.aviso_reactions
FOR SELECT TO authenticated
USING (public.can_view_aviso(auth.uid(), aviso_id));

CREATE POLICY "Insert own reaction" ON public.aviso_reactions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.can_view_aviso(auth.uid(), aviso_id));

CREATE POLICY "Delete own reaction" ON public.aviso_reactions
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- aviso_comments
CREATE TABLE public.aviso_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aviso_id uuid NOT NULL REFERENCES public.avisos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_comment_id uuid REFERENCES public.aviso_comments(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
CREATE INDEX idx_aviso_comments_aviso ON public.aviso_comments(aviso_id, created_at DESC);

ALTER TABLE public.aviso_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View comments" ON public.aviso_comments
FOR SELECT TO authenticated
USING (public.can_view_aviso(auth.uid(), aviso_id));

CREATE POLICY "Insert own comment" ON public.aviso_comments
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.can_view_aviso(auth.uid(), aviso_id));

CREATE POLICY "Author edits within 15min" ON public.aviso_comments
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND created_at > now() - interval '15 minutes')
WITH CHECK (user_id = auth.uid() AND created_at > now() - interval '15 minutes');

CREATE POLICY "Moderators soft delete" ON public.aviso_comments
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::cargo_tipo) OR public.has_role(auth.uid(), 'master'::cargo_tipo))
WITH CHECK (public.has_role(auth.uid(), 'admin'::cargo_tipo) OR public.has_role(auth.uid(), 'master'::cargo_tipo));

CREATE POLICY "Delete own or moderator" ON public.aviso_comments
FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::cargo_tipo) OR public.has_role(auth.uid(), 'master'::cargo_tipo));

-- Notification trigger
CREATE OR REPLACE FUNCTION public.notify_aviso_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _aviso_title text;
  _aviso_author uuid;
  _parent_author uuid;
  _commenter_name text;
BEGIN
  SELECT titulo, criado_por INTO _aviso_title, _aviso_author FROM public.avisos WHERE id = NEW.aviso_id;
  SELECT nome INTO _commenter_name FROM public.profiles WHERE user_id = NEW.user_id;

  IF NEW.parent_comment_id IS NULL THEN
    IF _aviso_author IS NOT NULL AND _aviso_author <> NEW.user_id THEN
      INSERT INTO public.notification_events (type, title, body, recipient_user_id, payload)
      VALUES ('aviso_comment',
              'Novo comentário no seu aviso',
              COALESCE(_commenter_name, 'Alguém') || ' comentou em "' || COALESCE(_aviso_title, 'aviso') || '"',
              _aviso_author,
              jsonb_build_object('aviso_id', NEW.aviso_id, 'comment_id', NEW.id));
    END IF;
  ELSE
    SELECT user_id INTO _parent_author FROM public.aviso_comments WHERE id = NEW.parent_comment_id;
    IF _parent_author IS NOT NULL AND _parent_author <> NEW.user_id THEN
      INSERT INTO public.notification_events (type, title, body, recipient_user_id, payload)
      VALUES ('aviso_comment_reply',
              'Resposta ao seu comentário',
              COALESCE(_commenter_name, 'Alguém') || ' respondeu em "' || COALESCE(_aviso_title, 'aviso') || '"',
              _parent_author,
              jsonb_build_object('aviso_id', NEW.aviso_id, 'comment_id', NEW.id, 'parent_comment_id', NEW.parent_comment_id));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_aviso_comment
AFTER INSERT ON public.aviso_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_aviso_comment();
