
-- Criar enums faltantes (para uso futuro)
DO $$ BEGIN CREATE TYPE public.colaborador_status AS ENUM ('ativo', 'inativo', 'ferias', 'afastado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.advertencia_tipo AS ENUM ('verbal', 'escrita'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.ocorrencia_status AS ENUM ('aberta', 'em_andamento', 'concluida'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- created_at em user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- constraint suspensoes
DO $$ BEGIN
  ALTER TABLE public.suspensoes ADD CONSTRAINT suspensoes_periodo_check CHECK (data_fim >= data_inicio);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Triggers updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_colaboradores_updated_at ON public.colaboradores;
CREATE TRIGGER update_colaboradores_updated_at BEFORE UPDATE ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ocorrencias_updated_at ON public.ocorrencias;
CREATE TRIGGER update_ocorrencias_updated_at BEFORE UPDATE ON public.ocorrencias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_unidade ON public.profiles(unidade);
CREATE INDEX IF NOT EXISTS idx_profiles_cargo ON public.profiles(cargo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_unidade ON public.colaboradores(unidade);
CREATE INDEX IF NOT EXISTS idx_colaboradores_setor ON public.colaboradores(setor);
CREATE INDEX IF NOT EXISTS idx_colaboradores_status ON public.colaboradores(status);
CREATE INDEX IF NOT EXISTS idx_advertencias_colaborador_id ON public.advertencias(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_advertencias_unidade ON public.advertencias(unidade);
CREATE INDEX IF NOT EXISTS idx_advertencias_data ON public.advertencias(data);
CREATE INDEX IF NOT EXISTS idx_suspensoes_colaborador_id ON public.suspensoes(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_suspensoes_unidade ON public.suspensoes(unidade);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_unidade ON public.ocorrencias(unidade);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_setor ON public.ocorrencias(setor);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_status ON public.ocorrencias(status);
CREATE INDEX IF NOT EXISTS idx_noticias_unidade ON public.noticias(unidade);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Dados iniciais
INSERT INTO public.noticias (titulo, conteudo, importante, unidade)
VALUES
  ('Bem-vindos ao Curió Conecta', 'Plataforma interna oficial do Supermercado Curió.', true, null),
  ('Comunicado Geral', 'Todos os colaboradores devem acompanhar os avisos da plataforma.', true, null)
ON CONFLICT DO NOTHING;
