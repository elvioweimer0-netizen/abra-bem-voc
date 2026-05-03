
-- 1. Topics
CREATE TABLE public.mentorship_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  icon text,
  ordem smallint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentorship_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view topics" ON public.mentorship_topics
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage topics" ON public.mentorship_topics
FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'::cargo_tipo) OR public.has_role(auth.uid(),'master'::cargo_tipo))
WITH CHECK (public.has_role(auth.uid(),'admin'::cargo_tipo) OR public.has_role(auth.uid(),'master'::cargo_tipo));

-- Seed topics
INSERT INTO public.mentorship_topics (code, name, icon, ordem) VALUES
  ('vendas','Vendas','💼',1),
  ('estoque','Estoque','📦',2),
  ('atendimento','Atendimento','🤝',3),
  ('lideranca','Liderança','👥',4),
  ('padaria','Padaria','🥖',5),
  ('acougue','Açougue','🥩',6),
  ('flv','FLV','🥬',7),
  ('frente_caixa','Frente de Caixa','🛒',8),
  ('carreira_curio','Carreira no Curió','🚀',9),
  ('cliente_dificil','Lidar com cliente difícil','😤',10)
ON CONFLICT (code) DO NOTHING;

-- 2. Offers
CREATE TABLE public.user_mentorship_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.mentorship_topics(id) ON DELETE CASCADE,
  message text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);
CREATE INDEX idx_offers_topic ON public.user_mentorship_offers(topic_id) WHERE active = true;
CREATE INDEX idx_offers_user ON public.user_mentorship_offers(user_id);

ALTER TABLE public.user_mentorship_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view offers" ON public.user_mentorship_offers
FOR SELECT TO authenticated USING (true);

CREATE POLICY "User manages own offers insert" ON public.user_mentorship_offers
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "User manages own offers update" ON public.user_mentorship_offers
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "User manages own offers delete" ON public.user_mentorship_offers
FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 3. Requests
CREATE TABLE public.mentorship_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  mentor_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.mentorship_topics(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','aceito','recusado','concluido')),
  mentor_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CHECK (requester_user_id <> mentor_user_id)
);
CREATE INDEX idx_mreq_mentor_status ON public.mentorship_requests(mentor_user_id, status);
CREATE INDEX idx_mreq_requester_status ON public.mentorship_requests(requester_user_id, status);

ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view requests" ON public.mentorship_requests
FOR SELECT TO authenticated
USING (auth.uid() = requester_user_id OR auth.uid() = mentor_user_id);

CREATE POLICY "Requester creates request" ON public.mentorship_requests
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requester_user_id AND requester_user_id <> mentor_user_id);

CREATE POLICY "Mentor or requester updates" ON public.mentorship_requests
FOR UPDATE TO authenticated
USING (auth.uid() = mentor_user_id OR auth.uid() = requester_user_id)
WITH CHECK (auth.uid() = mentor_user_id OR auth.uid() = requester_user_id);

-- 4. Notification triggers
CREATE OR REPLACE FUNCTION public.tg_mentorship_request_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _topic text;
  _requester text;
BEGIN
  SELECT name INTO _topic FROM public.mentorship_topics WHERE id = NEW.topic_id;
  SELECT nome INTO _requester FROM public.profiles WHERE user_id = NEW.requester_user_id;
  INSERT INTO public.notification_events (type, recipient_user_id, title, body, payload)
  VALUES ('mentorship_request',
          NEW.mentor_user_id,
          'Pediram sua mentoria',
          COALESCE(_requester,'Alguém') || ' quer conversar sobre ' || COALESCE(_topic,'um tópico'),
          jsonb_build_object('request_id', NEW.id, 'topic_id', NEW.topic_id, 'requester_user_id', NEW.requester_user_id));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mentorship_request_notify
AFTER INSERT ON public.mentorship_requests
FOR EACH ROW EXECUTE FUNCTION public.tg_mentorship_request_notify();

CREATE OR REPLACE FUNCTION public.tg_mentorship_status_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _topic text;
  _mentor text;
  _label text;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status NOT IN ('aceito','recusado','concluido') THEN
    RETURN NEW;
  END IF;
  SELECT name INTO _topic FROM public.mentorship_topics WHERE id = NEW.topic_id;
  SELECT nome INTO _mentor FROM public.profiles WHERE user_id = NEW.mentor_user_id;
  _label := CASE NEW.status
    WHEN 'aceito' THEN 'aceitou'
    WHEN 'recusado' THEN 'recusou'
    WHEN 'concluido' THEN 'marcou como concluído'
  END;
  INSERT INTO public.notification_events (type, recipient_user_id, title, body, payload)
  VALUES ('mentorship_response',
          CASE WHEN NEW.status='concluido' THEN NEW.mentor_user_id ELSE NEW.requester_user_id END,
          'Mentoria atualizada',
          COALESCE(_mentor,'Mentor') || ' ' || _label || ' sua conversa sobre ' || COALESCE(_topic,'um tópico'),
          jsonb_build_object('request_id', NEW.id, 'status', NEW.status));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mentorship_status_notify
AFTER UPDATE ON public.mentorship_requests
FOR EACH ROW EXECUTE FUNCTION public.tg_mentorship_status_notify();
