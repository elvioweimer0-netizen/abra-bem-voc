
-- Enum for meeting type
CREATE TYPE public.reuniao_tipo AS ENUM ('online', 'presencial', 'hibrida');

-- Enum for meeting status
CREATE TYPE public.reuniao_status AS ENUM ('agendada', 'em_andamento', 'finalizada', 'cancelada');

-- Enum for gallery category
CREATE TYPE public.galeria_categoria AS ENUM ('equipe', 'eventos', 'campanhas', 'loja', 'destaques');

-- Meetings table
CREATE TABLE public.reunioes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data DATE NOT NULL,
  horario TIME NOT NULL,
  duracao_minutos INTEGER NOT NULL DEFAULT 60,
  unidade public.unidade_tipo,
  departamento public.setor_tipo,
  tipo public.reuniao_tipo NOT NULL DEFAULT 'online',
  status public.reuniao_status NOT NULL DEFAULT 'agendada',
  link TEXT,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View reunioes" ON public.reunioes FOR SELECT TO authenticated
  USING (
    unidade IS NULL
    OR has_role(auth.uid(), 'admin')
    OR unidade = get_user_unidade(auth.uid())
  );

CREATE POLICY "Create reunioes" ON public.reunioes FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'gerente')
    OR has_role(auth.uid(), 'lider')
  );

CREATE POLICY "Update reunioes" ON public.reunioes FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (criado_por = auth.uid())
  );

CREATE POLICY "Delete reunioes" ON public.reunioes FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (criado_por = auth.uid())
  );

-- Gallery table
CREATE TABLE public.galeria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria public.galeria_categoria NOT NULL DEFAULT 'equipe',
  unidade public.unidade_tipo,
  imagem_url TEXT NOT NULL,
  publicado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View galeria" ON public.galeria FOR SELECT TO authenticated
  USING (
    unidade IS NULL
    OR has_role(auth.uid(), 'admin')
    OR unidade = get_user_unidade(auth.uid())
  );

CREATE POLICY "Create galeria" ON public.galeria FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'gerente')
    OR has_role(auth.uid(), 'lider')
  );

CREATE POLICY "Delete galeria" ON public.galeria FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (publicado_por = auth.uid())
  );

-- Storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public) VALUES ('galeria', 'galeria', true);

CREATE POLICY "Authenticated users can upload gallery images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'galeria');

CREATE POLICY "Anyone can view gallery images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'galeria');

CREATE POLICY "Admins and uploaders can delete gallery images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'galeria'
    AND (
      has_role(auth.uid(), 'admin')
      OR (auth.uid()::text = (storage.foldername(name))[1])
    )
  );

-- Enable realtime for reunioes
ALTER PUBLICATION supabase_realtime ADD TABLE public.reunioes;
