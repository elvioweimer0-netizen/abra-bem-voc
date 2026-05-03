
-- ============ CATEGORIES ============
CREATE TABLE public.playbook_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  icon text,
  description text,
  ordem smallint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ ARTICLES ============
CREATE TABLE public.playbook_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.playbook_categories(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 150),
  context text NOT NULL,
  script text,
  what_not_to_do text,
  real_example text,
  video_url text,
  tags text[] NOT NULL DEFAULT '{}',
  visible_to text[] NOT NULL DEFAULT '{master,admin,supervisor,gerente_loja,gerente_adm,encarregado,fiscal,lider_setor}',
  created_by uuid,
  version int NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  featured_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_playbook_articles_category ON public.playbook_articles(category_id);
CREATE INDEX idx_playbook_articles_visible_to ON public.playbook_articles USING GIN(visible_to);
CREATE INDEX idx_playbook_articles_tags ON public.playbook_articles USING GIN(tags);

-- ============ VIEWS ============
CREATE TABLE public.playbook_article_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.playbook_articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_playbook_views_article_user ON public.playbook_article_views(article_id, user_id);
CREATE INDEX idx_playbook_views_user_recent ON public.playbook_article_views(user_id, viewed_at DESC);

-- ============ FEEDBACK ============
CREATE TABLE public.playbook_article_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.playbook_articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  useful boolean,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (article_id, user_id)
);

-- ============ HELPER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.is_rh_or_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(_uid, 'admin'::cargo_tipo)
    OR public.has_role(_uid, 'master'::cargo_tipo)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = _uid
        AND p.cargo = 'gerente_adm'::cargo_tipo
        AND (
          lower(coalesce(p.cargo_titulo,'')) LIKE '%recursos humanos%'
          OR lower(coalesce(p.descricao,'')) LIKE '%recursos humanos%'
        )
    )
$$;

CREATE OR REPLACE FUNCTION public.can_view_playbook_article(_uid uuid, _article_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.playbook_articles a
    JOIN public.profiles p ON p.user_id = _uid
    WHERE a.id = _article_id
      AND (
        public.is_rh_or_admin(_uid)
        OR (a.active = true AND p.cargo::text = ANY(a.visible_to))
      )
  )
$$;

-- ============ TRIGGER: version increment ============
CREATE OR REPLACE FUNCTION public.tg_playbook_article_version()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.title IS DISTINCT FROM OLD.title OR
    NEW.context IS DISTINCT FROM OLD.context OR
    NEW.script IS DISTINCT FROM OLD.script OR
    NEW.what_not_to_do IS DISTINCT FROM OLD.what_not_to_do OR
    NEW.real_example IS DISTINCT FROM OLD.real_example OR
    NEW.video_url IS DISTINCT FROM OLD.video_url
  ) THEN
    NEW.version := COALESCE(OLD.version,1) + 1;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_playbook_article_version
BEFORE UPDATE ON public.playbook_articles
FOR EACH ROW EXECUTE FUNCTION public.tg_playbook_article_version();

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_playbook_categories_updated_at
BEFORE UPDATE ON public.playbook_categories
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_playbook_feedback_updated_at
BEFORE UPDATE ON public.playbook_article_feedback
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ RLS ============
ALTER TABLE public.playbook_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_article_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_article_feedback ENABLE ROW LEVEL SECURITY;

-- categories
CREATE POLICY "View categories" ON public.playbook_categories
FOR SELECT TO authenticated USING (true);
CREATE POLICY "RH manages categories - insert" ON public.playbook_categories
FOR INSERT TO authenticated WITH CHECK (public.is_rh_or_admin(auth.uid()));
CREATE POLICY "RH manages categories - update" ON public.playbook_categories
FOR UPDATE TO authenticated USING (public.is_rh_or_admin(auth.uid())) WITH CHECK (public.is_rh_or_admin(auth.uid()));
CREATE POLICY "RH manages categories - delete" ON public.playbook_categories
FOR DELETE TO authenticated USING (public.is_rh_or_admin(auth.uid()));

-- articles
CREATE POLICY "View articles by role" ON public.playbook_articles
FOR SELECT TO authenticated USING (
  public.is_rh_or_admin(auth.uid())
  OR (
    active = true
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.cargo::text = ANY(visible_to)
    )
  )
);
CREATE POLICY "RH inserts articles" ON public.playbook_articles
FOR INSERT TO authenticated WITH CHECK (public.is_rh_or_admin(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "RH updates articles" ON public.playbook_articles
FOR UPDATE TO authenticated USING (public.is_rh_or_admin(auth.uid())) WITH CHECK (public.is_rh_or_admin(auth.uid()));
-- DELETE intentionally not granted (use active=false)

-- views
CREATE POLICY "Insert own view" ON public.playbook_article_views
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "View own views or RH" ON public.playbook_article_views
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_rh_or_admin(auth.uid()));

-- feedback
CREATE POLICY "Insert own feedback" ON public.playbook_article_feedback
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own feedback" ON public.playbook_article_feedback
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own feedback" ON public.playbook_article_feedback
FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "View own feedback or RH" ON public.playbook_article_feedback
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_rh_or_admin(auth.uid()));

-- ============ SEED CATEGORIES ============
INSERT INTO public.playbook_categories (code, name, icon, description, ordem) VALUES
  ('como_conduzir',   'Como Conduzir',   'compass',     'Boas práticas para conduzir reuniões, turnos e equipes', 1),
  ('como_abordar',    'Como Abordar',    'message-circle', 'Como iniciar conversas difíceis com colaboradores',   2),
  ('como_cobrar',     'Como Cobrar',     'target',      'Cobrança firme e respeitosa de resultados e tarefas',     3),
  ('como_ensinar',    'Como Ensinar',    'graduation-cap','Treinar e desenvolver pessoas no dia a dia',             4),
  ('como_reconhecer', 'Como Reconhecer', 'award',       'Reconhecer o que merece destaque no time',                5),
  ('como_resolver',   'Como Resolver',   'wrench',      'Resolver conflitos, problemas e ocorrências',             6);
