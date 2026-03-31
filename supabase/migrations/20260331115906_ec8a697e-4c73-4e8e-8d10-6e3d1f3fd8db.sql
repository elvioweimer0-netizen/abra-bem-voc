
-- Enum for endomarketing types
CREATE TYPE public.endomarketing_tipo AS ENUM (
  'aniversario',
  'destaque',
  'campanha',
  'mensagem'
);

-- Endomarketing table
CREATE TABLE public.endomarketing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.endomarketing_tipo NOT NULL,
  titulo text NOT NULL,
  descricao text,
  unidade public.unidade_tipo,
  data date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Avisos table
CREATE TABLE public.avisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  conteudo text NOT NULL,
  urgente boolean NOT NULL DEFAULT false,
  unidade public.unidade_tipo,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.endomarketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

-- Endomarketing policies
CREATE POLICY "View endomarketing" ON public.endomarketing
  FOR SELECT TO authenticated
  USING (
    unidade IS NULL
    OR has_role(auth.uid(), 'admin')
    OR unidade = get_user_unidade(auth.uid())
  );

CREATE POLICY "Create endomarketing" ON public.endomarketing
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR (has_role(auth.uid(), 'gerente') AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
  );

CREATE POLICY "Update endomarketing" ON public.endomarketing
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (has_role(auth.uid(), 'gerente') AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
  );

CREATE POLICY "Delete endomarketing" ON public.endomarketing
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (has_role(auth.uid(), 'gerente') AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
  );

-- Avisos policies
CREATE POLICY "View avisos" ON public.avisos
  FOR SELECT TO authenticated
  USING (
    unidade IS NULL
    OR has_role(auth.uid(), 'admin')
    OR unidade = get_user_unidade(auth.uid())
  );

CREATE POLICY "Create avisos" ON public.avisos
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR (has_role(auth.uid(), 'gerente') AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
  );

CREATE POLICY "Update avisos" ON public.avisos
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (has_role(auth.uid(), 'gerente') AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
  );

CREATE POLICY "Delete avisos" ON public.avisos
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (has_role(auth.uid(), 'gerente') AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
  );

-- Indexes
CREATE INDEX idx_endomarketing_unidade ON public.endomarketing(unidade);
CREATE INDEX idx_endomarketing_tipo ON public.endomarketing(tipo);
CREATE INDEX idx_avisos_unidade ON public.avisos(unidade);
CREATE INDEX idx_avisos_ativo ON public.avisos(ativo);

-- Also add UPDATE and DELETE policies to noticias for CRUD
CREATE POLICY "Update noticias" ON public.noticias
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (has_role(auth.uid(), 'gerente') AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
  );

CREATE POLICY "Delete noticias" ON public.noticias
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (has_role(auth.uid(), 'gerente') AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
  );
