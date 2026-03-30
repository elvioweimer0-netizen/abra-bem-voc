
-- Enum for units
CREATE TYPE public.unidade_tipo AS ENUM ('UND 1', 'UND 2', 'UND 3', 'UND 4', 'Central de Produção', 'Centro de Distribuição');

-- Enum for roles
CREATE TYPE public.cargo_tipo AS ENUM ('admin', 'gerente', 'lider', 'colaborador');

-- Enum for sectors
CREATE TYPE public.setor_tipo AS ENUM ('acougue', 'padaria', 'hortifruti', 'mercearia', 'frente_de_caixa', 'deposito');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  unidade unidade_tipo NOT NULL,
  cargo cargo_tipo NOT NULL DEFAULT 'colaborador',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role cargo_tipo NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role cargo_tipo)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer function to get user unit
CREATE OR REPLACE FUNCTION public.get_user_unidade(_user_id UUID)
RETURNS unidade_tipo
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unidade FROM public.profiles WHERE user_id = _user_id
$$;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Managers can view unit profiles" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'gerente') AND unidade = public.get_user_unidade(auth.uid())
);
CREATE POLICY "Leaders can view unit profiles" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'lider') AND unidade = public.get_user_unidade(auth.uid())
);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Colaboradores table
CREATE TABLE public.colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  matricula TEXT NOT NULL UNIQUE,
  cargo TEXT NOT NULL,
  setor setor_tipo NOT NULL,
  unidade unidade_tipo NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_colaboradores_updated_at BEFORE UPDATE ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated users can view colaboradores of their unit" ON public.colaboradores FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR unidade = public.get_user_unidade(auth.uid())
);
CREATE POLICY "Admins and managers can insert colaboradores" ON public.colaboradores FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'gerente') AND unidade = public.get_user_unidade(auth.uid()))
);
CREATE POLICY "Admins and managers can update colaboradores" ON public.colaboradores FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'gerente') AND unidade = public.get_user_unidade(auth.uid()))
);

-- Advertencias table
CREATE TABLE public.advertencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('verbal', 'escrita')),
  motivo TEXT NOT NULL,
  descricao TEXT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  responsavel TEXT NOT NULL,
  unidade unidade_tipo NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.advertencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View advertencias" ON public.advertencias FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR unidade = public.get_user_unidade(auth.uid())
);
CREATE POLICY "Create advertencias" ON public.advertencias FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR (
    (public.has_role(auth.uid(), 'gerente') OR public.has_role(auth.uid(), 'lider'))
    AND unidade = public.get_user_unidade(auth.uid())
  )
);

-- Suspensoes table
CREATE TABLE public.suspensoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  responsavel TEXT NOT NULL,
  unidade unidade_tipo NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suspensoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View suspensoes" ON public.suspensoes FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR unidade = public.get_user_unidade(auth.uid())
);
CREATE POLICY "Create suspensoes" ON public.suspensoes FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR (
    (public.has_role(auth.uid(), 'gerente') OR public.has_role(auth.uid(), 'lider'))
    AND unidade = public.get_user_unidade(auth.uid())
  )
);

-- Ocorrencias table (departamento)
CREATE TABLE public.ocorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setor setor_tipo NOT NULL,
  descricao TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'resolvida')),
  unidade unidade_tipo NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_ocorrencias_updated_at BEFORE UPDATE ON public.ocorrencias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "View ocorrencias" ON public.ocorrencias FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR unidade = public.get_user_unidade(auth.uid())
);
CREATE POLICY "Create ocorrencias" ON public.ocorrencias FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR unidade = public.get_user_unidade(auth.uid())
);
CREATE POLICY "Update ocorrencias" ON public.ocorrencias FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'gerente') AND unidade = public.get_user_unidade(auth.uid()))
);

-- Noticias table
CREATE TABLE public.noticias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  importante BOOLEAN NOT NULL DEFAULT false,
  unidade unidade_tipo,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View noticias" ON public.noticias FOR SELECT TO authenticated USING (
  unidade IS NULL OR public.has_role(auth.uid(), 'admin') OR unidade = public.get_user_unidade(auth.uid())
);
CREATE POLICY "Admin create noticias" ON public.noticias FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente')
);

-- Auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, unidade, cargo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'unidade')::unidade_tipo, 'UND 1'),
    COALESCE((NEW.raw_user_meta_data->>'cargo')::cargo_tipo, 'colaborador')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'cargo')::cargo_tipo, 'colaborador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
