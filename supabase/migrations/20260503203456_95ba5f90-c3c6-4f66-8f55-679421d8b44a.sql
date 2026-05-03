
-- ============ TABELAS ============

CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('direct','group','channel','unit_auto','setor_auto')),
  name text,
  description text,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  setor text,
  created_by uuid,
  image_url text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_conv_last_msg ON public.chat_conversations (last_message_at DESC);

CREATE TABLE public.chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin')),
  muted boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  UNIQUE (conversation_id, user_id)
);
CREATE INDEX idx_chat_part_user ON public.chat_participants (user_id, conversation_id);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  author_user_id uuid,
  content text,
  media_url text,
  media_type text CHECK (media_type IN ('image','video','audio','document')),
  media_duration_sec int,
  reply_to_message_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  forwarded_from_message_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
CREATE INDEX idx_chat_msg_conv ON public.chat_messages (conversation_id, created_at DESC);

CREATE TABLE public.chat_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

CREATE TABLE public.chat_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL CHECK (emoji IN ('👍','❤️','😂','😮','😢','🙏','🔥','💪')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE TABLE public.chat_message_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  reporter_user_id uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

CREATE TABLE public.chat_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor_user_id uuid,
  target_message_id uuid,
  conversation_id uuid,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ FUNÇÕES ============

CREATE OR REPLACE FUNCTION public.is_chat_participant(_uid uuid, _conv uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.chat_participants WHERE conversation_id=_conv AND user_id=_uid)
$$;

CREATE OR REPLACE FUNCTION public.is_chat_admin(_uid uuid, _conv uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.chat_participants WHERE conversation_id=_conv AND user_id=_uid AND role='admin')
$$;

CREATE OR REPLACE FUNCTION public.chat_unread_count(_uid uuid)
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE(COUNT(m.id),0)::int FROM public.chat_participants p
  JOIN public.chat_messages m ON m.conversation_id=p.conversation_id
  WHERE p.user_id=_uid AND p.muted=false AND p.archived=false
    AND m.author_user_id <> _uid AND m.deleted_at IS NULL
    AND m.created_at > COALESCE(p.last_read_at, p.joined_at)
$$;

CREATE OR REPLACE FUNCTION public.chat_mark_read(_conv uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.chat_participants SET last_read_at=now()
   WHERE conversation_id=_conv AND user_id=auth.uid();
  INSERT INTO public.chat_message_reads (message_id, user_id)
  SELECT m.id, auth.uid() FROM public.chat_messages m
   WHERE m.conversation_id=_conv AND m.deleted_at IS NULL
     AND m.author_user_id <> auth.uid()
  ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.create_or_get_direct_chat(_other uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _me uuid := auth.uid(); _conv uuid;
BEGIN
  IF _me IS NULL OR _other IS NULL OR _me=_other THEN RAISE EXCEPTION 'Invalid'; END IF;
  SELECT c.id INTO _conv FROM public.chat_conversations c
   WHERE c.type='direct'
     AND EXISTS (SELECT 1 FROM public.chat_participants WHERE conversation_id=c.id AND user_id=_me)
     AND EXISTS (SELECT 1 FROM public.chat_participants WHERE conversation_id=c.id AND user_id=_other)
   LIMIT 1;
  IF _conv IS NOT NULL THEN RETURN _conv; END IF;
  INSERT INTO public.chat_conversations (type, created_by) VALUES ('direct', _me) RETURNING id INTO _conv;
  INSERT INTO public.chat_participants (conversation_id, user_id, role) VALUES (_conv, _me, 'admin'),(_conv, _other, 'member');
  RETURN _conv;
END $$;

-- ============ TRIGGERS ============

CREATE OR REPLACE FUNCTION public.tg_chat_message_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _preview text; _author_name text; recipient record;
BEGIN
  _preview := CASE
    WHEN NEW.media_type='image' THEN '📷 Foto'
    WHEN NEW.media_type='video' THEN '🎥 Vídeo'
    WHEN NEW.media_type='audio' THEN '🎤 Áudio'
    WHEN NEW.media_type='document' THEN '📄 Documento'
    ELSE LEFT(COALESCE(NEW.content,''), 80)
  END;
  UPDATE public.chat_conversations
    SET last_message_at=NEW.created_at, last_message_preview=_preview
    WHERE id=NEW.conversation_id;
  INSERT INTO public.chat_message_reads (message_id, user_id)
    VALUES (NEW.id, NEW.author_user_id) ON CONFLICT DO NOTHING;
  SELECT nome INTO _author_name FROM public.profiles WHERE user_id=NEW.author_user_id;
  FOR recipient IN
    SELECT user_id FROM public.chat_participants
     WHERE conversation_id=NEW.conversation_id AND user_id<>NEW.author_user_id AND muted=false
  LOOP
    INSERT INTO public.notification_events (type, recipient_user_id, title, body, payload)
    VALUES ('chat_message', recipient.user_id, COALESCE(_author_name,'Nova mensagem'), _preview,
      jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id));
  END LOOP;
  RETURN NEW;
END $$;

CREATE TRIGGER tg_chat_message_after_insert
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.tg_chat_message_after_insert();

CREATE OR REPLACE FUNCTION public.tg_chat_message_edit_window()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO public.chat_audit_log (action, actor_user_id, target_message_id, conversation_id)
      VALUES ('delete', auth.uid(), NEW.id, NEW.conversation_id);
    RETURN NEW;
  END IF;
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    IF OLD.created_at < now() - interval '15 minutes' THEN
      RAISE EXCEPTION 'Edição permitida apenas nos primeiros 15 minutos';
    END IF;
    NEW.edited_at := now();
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER tg_chat_message_edit_window
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.tg_chat_message_edit_window();

CREATE OR REPLACE FUNCTION public.tg_chat_added_to_group_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _conv record;
BEGIN
  SELECT type, name INTO _conv FROM public.chat_conversations WHERE id=NEW.conversation_id;
  IF _conv.type IN ('group','channel') THEN
    INSERT INTO public.notification_events (type, recipient_user_id, title, body, payload)
    VALUES ('chat_added_to_group', NEW.user_id, 'Adicionado a grupo', COALESCE(_conv.name,'Novo grupo'),
      jsonb_build_object('conversation_id', NEW.conversation_id));
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER tg_chat_added_to_group_notify
AFTER INSERT ON public.chat_participants
FOR EACH ROW EXECUTE FUNCTION public.tg_chat_added_to_group_notify();

-- ============ RLS ============

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_conv_select ON public.chat_conversations FOR SELECT
  USING (public.is_chat_participant(auth.uid(), id));
CREATE POLICY chat_conv_insert ON public.chat_conversations FOR INSERT
  WITH CHECK (auth.uid()=created_by AND (type='direct' OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master')));
CREATE POLICY chat_conv_update ON public.chat_conversations FOR UPDATE
  USING (public.is_chat_admin(auth.uid(), id) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));
CREATE POLICY chat_conv_delete ON public.chat_conversations FOR DELETE
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));

CREATE POLICY chat_part_select ON public.chat_participants FOR SELECT
  USING (public.is_chat_participant(auth.uid(), conversation_id));
CREATE POLICY chat_part_insert ON public.chat_participants FOR INSERT
  WITH CHECK (public.is_chat_admin(auth.uid(), conversation_id) OR auth.uid()=user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));
CREATE POLICY chat_part_update ON public.chat_participants FOR UPDATE
  USING (auth.uid()=user_id OR public.is_chat_admin(auth.uid(), conversation_id));
CREATE POLICY chat_part_delete ON public.chat_participants FOR DELETE
  USING (auth.uid()=user_id OR public.is_chat_admin(auth.uid(), conversation_id) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY chat_msg_select ON public.chat_messages FOR SELECT
  USING (public.is_chat_participant(auth.uid(), conversation_id));
CREATE POLICY chat_msg_insert ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid()=author_user_id AND public.is_chat_participant(auth.uid(), conversation_id));
CREATE POLICY chat_msg_update ON public.chat_messages FOR UPDATE
  USING (auth.uid()=author_user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));
CREATE POLICY chat_msg_delete ON public.chat_messages FOR DELETE
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));

CREATE POLICY chat_reads_select ON public.chat_message_reads FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chat_messages m WHERE m.id=message_id AND public.is_chat_participant(auth.uid(), m.conversation_id)));
CREATE POLICY chat_reads_insert ON public.chat_message_reads FOR INSERT
  WITH CHECK (auth.uid()=user_id);

CREATE POLICY chat_reac_select ON public.chat_message_reactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chat_messages m WHERE m.id=message_id AND public.is_chat_participant(auth.uid(), m.conversation_id)));
CREATE POLICY chat_reac_insert ON public.chat_message_reactions FOR INSERT
  WITH CHECK (auth.uid()=user_id);
CREATE POLICY chat_reac_delete ON public.chat_message_reactions FOR DELETE
  USING (auth.uid()=user_id);

CREATE POLICY chat_rep_select ON public.chat_message_reports FOR SELECT
  USING (auth.uid()=reporter_user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));
CREATE POLICY chat_rep_insert ON public.chat_message_reports FOR INSERT
  WITH CHECK (auth.uid()=reporter_user_id);
CREATE POLICY chat_rep_update ON public.chat_message_reports FOR UPDATE
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));

CREATE POLICY chat_audit_select ON public.chat_audit_log FOR SELECT
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));

-- ============ STORAGE ============

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-media', 'chat-media', false, 52428800)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY chat_media_select ON storage.objects FOR SELECT
  USING (bucket_id='chat-media' AND public.is_chat_participant(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY chat_media_insert ON storage.objects FOR INSERT
  WITH CHECK (bucket_id='chat-media' AND public.is_chat_participant(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY chat_media_delete ON storage.objects FOR DELETE
  USING (bucket_id='chat-media' AND (owner=auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master')));

-- ============ REALTIME ============

ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_participants REPLICA IDENTITY FULL;
ALTER TABLE public.chat_message_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.chat_message_reads REPLICA IDENTITY FULL;
ALTER TABLE public.chat_conversations REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
