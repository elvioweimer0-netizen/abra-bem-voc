-- =====================================================
-- MIGRAÇÃO: Reorganização do enum cargo_tipo
-- =====================================================

-- 1. Criar novo enum com os 10 valores finais
CREATE TYPE public.cargo_tipo_new AS ENUM (
  'master',
  'admin',
  'supervisor',
  'gerente',
  'gerente_loja',
  'gerente_adm',
  'encarregado',
  'fiscal',
  'lider_setor',
  'colaborador'
);

-- 2. Remover policies que dependem do enum antigo (serão recriadas)
DROP POLICY IF EXISTS "Create advertencias" ON public.advertencias;
DROP POLICY IF EXISTS "Create galeria" ON public.galeria;

-- 3. Migrar coluna profiles.cargo
ALTER TABLE public.profiles 
  ALTER COLUMN cargo DROP DEFAULT;

ALTER TABLE public.profiles 
  ALTER COLUMN cargo TYPE public.cargo_tipo_new
  USING (
    CASE 
      WHEN cargo::text = 'lider' THEN 'lider_setor'
      WHEN cargo::text = 'adm_departamento' THEN 'gerente_adm'
      ELSE cargo::text
    END::public.cargo_tipo_new
  );

ALTER TABLE public.profiles 
  ALTER COLUMN cargo SET DEFAULT 'colaborador'::public.cargo_tipo_new;

-- 4. Migrar coluna user_roles.role
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.cargo_tipo_new
  USING (
    CASE 
      WHEN role::text = 'lider' THEN 'lider_setor'
      WHEN role::text = 'adm_departamento' THEN 'gerente_adm'
      ELSE role::text
    END::public.cargo_tipo_new
  );

-- 5. Migrar profiles.role se existir (legado)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='role'
  ) THEN
    EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT';
    EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN role TYPE public.cargo_tipo_new USING (
      CASE 
        WHEN role::text = ''lider'' THEN ''lider_setor''
        WHEN role::text = ''adm_departamento'' THEN ''gerente_adm''
        ELSE role::text
      END::public.cargo_tipo_new
    )';
  END IF;
END $$;

-- 6. Substituir o enum antigo
DROP TYPE public.cargo_tipo CASCADE;
ALTER TYPE public.cargo_tipo_new RENAME TO cargo_tipo;

-- 7. Adicionar coluna lider_setor_id em profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS lider_setor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- =====================================================
-- 8. Recriar funções helper com novo enum
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role cargo_tipo)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_leadership(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'admin'::cargo_tipo)
    OR public.has_role(_user_id, 'master'::cargo_tipo)
    OR public.has_role(_user_id, 'supervisor'::cargo_tipo)
    OR public.has_role(_user_id, 'gerente'::cargo_tipo)
    OR public.has_role(_user_id, 'gerente_loja'::cargo_tipo)
    OR public.has_role(_user_id, 'encarregado'::cargo_tipo)
    OR public.has_role(_user_id, 'lider_setor'::cargo_tipo)
$$;

CREATE OR REPLACE FUNCTION public.is_unit_manager(_user_id uuid, _unit_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id AND p.unit_id = _unit_id
      AND (
        public.has_role(_user_id, 'gerente'::cargo_tipo) 
        OR public.has_role(_user_id, 'gerente_loja'::cargo_tipo) 
        OR public.has_role(_user_id, 'gerente_adm'::cargo_tipo) 
        OR public.has_role(_user_id, 'admin'::cargo_tipo) 
        OR public.has_role(_user_id, 'master'::cargo_tipo) 
        OR public.has_role(_user_id, 'supervisor'::cargo_tipo)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_unit(_user_id uuid, _unit_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id
      AND (
        public.has_role(_user_id, 'admin'::cargo_tipo)
        OR public.has_role(_user_id, 'master'::cargo_tipo)
        OR public.has_role(_user_id, 'supervisor'::cargo_tipo)
        OR p.unit_id = _unit_id
        OR _unit_id = ANY(p.permission_units)
      )
  )
$$;

-- =====================================================
-- 9. Recriar policies dropadas no passo 2
-- =====================================================

CREATE POLICY "Create advertencias" ON public.advertencias
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::cargo_tipo) 
  OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR ((has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo) OR has_role(auth.uid(), 'lider_setor'::cargo_tipo) OR has_role(auth.uid(), 'encarregado'::cargo_tipo)) AND (unidade = get_user_unidade(auth.uid())))
);

CREATE POLICY "Create galeria" ON public.galeria
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::cargo_tipo) 
  OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'gerente'::cargo_tipo) 
  OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo)
  OR has_role(auth.uid(), 'lider_setor'::cargo_tipo)
  OR has_role(auth.uid(), 'encarregado'::cargo_tipo)
);

-- =====================================================
-- 10. Recriar handle_new_user com novo enum
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, unidade, cargo, username, must_change_password, first_login_at, welcome_banner_dismissed, login_count)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'unidade')::unidade_tipo, 'CIDADE ALTA'),
    COALESCE(
      CASE 
        WHEN NEW.raw_user_meta_data->>'cargo' = 'lider' THEN 'lider_setor'
        WHEN NEW.raw_user_meta_data->>'cargo' = 'adm_departamento' THEN 'gerente_adm'
        ELSE NEW.raw_user_meta_data->>'cargo'
      END::cargo_tipo, 
      'colaborador'::cargo_tipo
    ),
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false),
    now(),
    false,
    0
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(
      CASE 
        WHEN NEW.raw_user_meta_data->>'cargo' = 'lider' THEN 'lider_setor'
        WHEN NEW.raw_user_meta_data->>'cargo' = 'adm_departamento' THEN 'gerente_adm'
        ELSE NEW.raw_user_meta_data->>'cargo'
      END::cargo_tipo,
      'colaborador'::cargo_tipo
    )
  );
  RETURN NEW;
END;
$$;