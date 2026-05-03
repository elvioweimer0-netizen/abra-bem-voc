
-- Helper: who can edit culture content
CREATE OR REPLACE FUNCTION public.is_culture_editor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::cargo_tipo)
      OR public.has_role(_user_id, 'master'::cargo_tipo)
      OR (
        public.has_role(_user_id, 'gerente_adm'::cargo_tipo)
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = _user_id
            AND lower(coalesce(p.cargo_titulo,'') || ' ' || coalesce(p.descricao,'') || ' ' || coalesce(p.nome,''))
                ~ '(recursos humanos|departamento pessoal|\mrh\M|\mdp\M|marketing)'
        )
      )
$$;

-- culture_values
CREATE TABLE public.culture_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#6366f1',
  icon text NOT NULL DEFAULT 'sparkles',
  ordem smallint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.culture_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authed views culture_values" ON public.culture_values
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors insert culture_values" ON public.culture_values
  FOR INSERT TO authenticated WITH CHECK (public.is_culture_editor(auth.uid()));
CREATE POLICY "Editors update culture_values" ON public.culture_values
  FOR UPDATE TO authenticated USING (public.is_culture_editor(auth.uid()))
  WITH CHECK (public.is_culture_editor(auth.uid()));

CREATE TRIGGER culture_values_set_updated
  BEFORE UPDATE ON public.culture_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- culture_pills
CREATE TABLE public.culture_pills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL CHECK (char_length(content) <= 280 AND char_length(content) > 0),
  value_id uuid NOT NULL REFERENCES public.culture_values(id) ON DELETE RESTRICT,
  image_url text,
  link_url text,
  display_date date NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_culture_pills_display_date ON public.culture_pills (display_date DESC);
CREATE INDEX idx_culture_pills_value ON public.culture_pills (value_id);

ALTER TABLE public.culture_pills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authed views culture_pills" ON public.culture_pills
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors insert culture_pills" ON public.culture_pills
  FOR INSERT TO authenticated WITH CHECK (public.is_culture_editor(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Editors update culture_pills" ON public.culture_pills
  FOR UPDATE TO authenticated USING (public.is_culture_editor(auth.uid()))
  WITH CHECK (public.is_culture_editor(auth.uid()));

CREATE TRIGGER culture_pills_set_updated
  BEFORE UPDATE ON public.culture_pills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- culture_pill_likes
CREATE TABLE public.culture_pill_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pill_id uuid NOT NULL REFERENCES public.culture_pills(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  liked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pill_id, user_id)
);

CREATE INDEX idx_culture_pill_likes_pill ON public.culture_pill_likes (pill_id);

ALTER TABLE public.culture_pill_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authed views likes" ON public.culture_pill_likes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own like" ON public.culture_pill_likes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own like" ON public.culture_pill_likes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Seed values
INSERT INTO public.culture_values (code, name, description, color, icon, ordem) VALUES
  ('acolhimento', 'Acolhimento', 'Recebemos cada pessoa com calor humano e respeito', '#f59e0b', 'heart-handshake', 1),
  ('qualidade', 'Qualidade', 'Excelência e capricho em tudo que entregamos', '#3b82f6', 'award', 2),
  ('compromisso', 'Compromisso', 'Palavra dada, palavra cumprida — com responsabilidade', '#10b981', 'shield-check', 3),
  ('familia_curio', 'Família Curió', 'Somos um time, somos família, cuidamos uns dos outros', '#ec4899', 'users', 4);
