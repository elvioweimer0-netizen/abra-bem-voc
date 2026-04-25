DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit_type') THEN
    CREATE TYPE public.unit_type AS ENUM ('loja', 'central');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checklist_period') THEN
    CREATE TYPE public.checklist_period AS ENUM ('abertura', 'durante', 'fechamento', 'producao_dia', 'operacao_cd');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checklist_role_target') THEN
    CREATE TYPE public.checklist_role_target AS ENUM ('gerente', 'encarregado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checklist_response_type') THEN
    CREATE TYPE public.checklist_response_type AS ENUM ('sim_nao', 'texto', 'foto');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checklist_status') THEN
    CREATE TYPE public.checklist_status AS ENUM ('pendente', 'parcial', 'completo');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'occurrence_type') THEN
    CREATE TYPE public.occurrence_type AS ENUM ('atendimento', 'quebra', 'manutencao', 'disciplina', 'outro');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'occurrence_severity') THEN
    CREATE TYPE public.occurrence_severity AS ENUM ('baixa', 'media', 'alta');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'occurrence_status') THEN
    CREATE TYPE public.occurrence_status AS ENUM ('aberto', 'em_tratamento', 'resolvido');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.units (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  type public.unit_type NOT NULL,
  location text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.cargo_tipo,
  ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id),
  ADD COLUMN IF NOT EXISTS permission_units uuid[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  unit_type text NOT NULL CHECK (unit_type IN ('loja', 'cp', 'cd', 'all')),
  period public.checklist_period NOT NULL,
  role_target public.checklist_role_target NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.checklist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  ordem integer NOT NULL,
  descricao text NOT NULL,
  obrigatorio boolean NOT NULL DEFAULT true,
  tipo_resposta public.checklist_response_type NOT NULL DEFAULT 'sim_nao',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id, ordem)
);

CREATE TABLE IF NOT EXISTS public.checklist_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id),
  data date NOT NULL DEFAULT CURRENT_DATE,
  status public.checklist_status NOT NULL DEFAULT 'pendente',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id, user_id, unit_id, data)
);

CREATE TABLE IF NOT EXISTS public.checklist_item_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  completion_id uuid NOT NULL REFERENCES public.checklist_completions(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  resposta text,
  foto_url text,
  observacao text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(completion_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.leadership_inspections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspector_id uuid NOT NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id),
  data date NOT NULL DEFAULT CURRENT_DATE,
  score_organizacao integer NOT NULL DEFAULT 0,
  score_atendimento integer NOT NULL DEFAULT 0,
  score_estoque integer NOT NULL DEFAULT 0,
  score_limpeza integer NOT NULL DEFAULT 0,
  observacoes_gerais text,
  fotos text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leadership_occurrences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id),
  reportado_por uuid NOT NULL,
  tipo public.occurrence_type NOT NULL DEFAULT 'outro',
  descricao text NOT NULL,
  foto_url text,
  gravidade public.occurrence_severity NOT NULL DEFAULT 'media',
  status public.occurrence_status NOT NULL DEFAULT 'aberto',
  atribuido_a uuid,
  criado_em timestamptz NOT NULL DEFAULT now(),
  resolvido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.user_can_access_unit(_user_id uuid, _unit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = _user_id
      AND (
        public.has_role(_user_id, 'admin')
        OR public.has_role(_user_id, 'master')
        OR public.has_role(_user_id, 'supervisor')
        OR p.unit_id = _unit_id
        OR _unit_id = ANY(p.permission_units)
      )
  )
$$;

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_item_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadership_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadership_occurrences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leadership can view units" ON public.units;
CREATE POLICY "Leadership can view units" ON public.units FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor') OR public.user_can_access_unit(auth.uid(), id));
DROP POLICY IF EXISTS "Admins manage units" ON public.units;
CREATE POLICY "Admins manage units" ON public.units FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));
DROP POLICY IF EXISTS "Leadership can view checklist templates" ON public.checklist_templates;
CREATE POLICY "Leadership can view checklist templates" ON public.checklist_templates FOR SELECT TO authenticated
USING (active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));
DROP POLICY IF EXISTS "Admins manage checklist templates" ON public.checklist_templates;
CREATE POLICY "Admins manage checklist templates" ON public.checklist_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));
DROP POLICY IF EXISTS "Leadership can view checklist items" ON public.checklist_items;
CREATE POLICY "Leadership can view checklist items" ON public.checklist_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.checklist_templates t WHERE t.id = template_id AND (t.active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'))));
DROP POLICY IF EXISTS "Admins manage checklist items" ON public.checklist_items;
CREATE POLICY "Admins manage checklist items" ON public.checklist_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));
DROP POLICY IF EXISTS "Leadership can view checklist completions" ON public.checklist_completions;
CREATE POLICY "Leadership can view checklist completions" ON public.checklist_completions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.user_can_access_unit(auth.uid(), unit_id));
DROP POLICY IF EXISTS "Users create own checklist completions" ON public.checklist_completions;
CREATE POLICY "Users create own checklist completions" ON public.checklist_completions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.user_can_access_unit(auth.uid(), unit_id));
DROP POLICY IF EXISTS "Users update own checklist completions" ON public.checklist_completions;
CREATE POLICY "Users update own checklist completions" ON public.checklist_completions FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor'));
DROP POLICY IF EXISTS "Leadership can view checklist responses" ON public.checklist_item_responses;
CREATE POLICY "Leadership can view checklist responses" ON public.checklist_item_responses FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.checklist_completions c WHERE c.id = completion_id AND (c.user_id = auth.uid() OR public.user_can_access_unit(auth.uid(), c.unit_id))));
DROP POLICY IF EXISTS "Users create own checklist responses" ON public.checklist_item_responses;
CREATE POLICY "Users create own checklist responses" ON public.checklist_item_responses FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.checklist_completions c WHERE c.id = completion_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users update own checklist responses" ON public.checklist_item_responses;
CREATE POLICY "Users update own checklist responses" ON public.checklist_item_responses FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.checklist_completions c WHERE c.id = completion_id AND c.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.checklist_completions c WHERE c.id = completion_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "Leadership can view inspections" ON public.leadership_inspections;
CREATE POLICY "Leadership can view inspections" ON public.leadership_inspections FOR SELECT TO authenticated
USING (public.user_can_access_unit(auth.uid(), unit_id));
DROP POLICY IF EXISTS "Supervisors create inspections" ON public.leadership_inspections;
CREATE POLICY "Supervisors create inspections" ON public.leadership_inspections FOR INSERT TO authenticated
WITH CHECK ((inspector_id = auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor')));
DROP POLICY IF EXISTS "Supervisors update inspections" ON public.leadership_inspections;
CREATE POLICY "Supervisors update inspections" ON public.leadership_inspections FOR UPDATE TO authenticated
USING (inspector_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'))
WITH CHECK (inspector_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));
DROP POLICY IF EXISTS "Leadership can view occurrences" ON public.leadership_occurrences;
CREATE POLICY "Leadership can view occurrences" ON public.leadership_occurrences FOR SELECT TO authenticated
USING (public.user_can_access_unit(auth.uid(), unit_id));
DROP POLICY IF EXISTS "Leadership can create occurrences" ON public.leadership_occurrences;
CREATE POLICY "Leadership can create occurrences" ON public.leadership_occurrences FOR INSERT TO authenticated
WITH CHECK (reportado_por = auth.uid() AND public.user_can_access_unit(auth.uid(), unit_id));
DROP POLICY IF EXISTS "Leadership can update occurrences" ON public.leadership_occurrences;
CREATE POLICY "Leadership can update occurrences" ON public.leadership_occurrences FOR UPDATE TO authenticated
USING (public.user_can_access_unit(auth.uid(), unit_id))
WITH CHECK (public.user_can_access_unit(auth.uid(), unit_id));

DROP TRIGGER IF EXISTS update_units_updated_at ON public.units;
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_checklist_templates_updated_at ON public.checklist_templates;
CREATE TRIGGER update_checklist_templates_updated_at BEFORE UPDATE ON public.checklist_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_checklist_completions_updated_at ON public.checklist_completions;
CREATE TRIGGER update_checklist_completions_updated_at BEFORE UPDATE ON public.checklist_completions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_checklist_item_responses_updated_at ON public.checklist_item_responses;
CREATE TRIGGER update_checklist_item_responses_updated_at BEFORE UPDATE ON public.checklist_item_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_leadership_inspections_updated_at ON public.leadership_inspections;
CREATE TRIGGER update_leadership_inspections_updated_at BEFORE UPDATE ON public.leadership_inspections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_leadership_occurrences_updated_at ON public.leadership_occurrences;
CREATE TRIGGER update_leadership_occurrences_updated_at BEFORE UPDATE ON public.leadership_occurrences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_profiles_unit_id ON public.profiles(unit_id);
CREATE INDEX IF NOT EXISTS idx_profiles_permission_units ON public.profiles USING GIN(permission_units);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_day ON public.checklist_completions(data, unit_id, user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_responses_completion ON public.checklist_item_responses(completion_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_unit_status ON public.leadership_occurrences(unit_id, status, criado_em);

INSERT INTO public.units (code, name, type, location, active) VALUES
  ('L01', 'Loja 01 - Cidade Alta', 'loja', 'CIDADE ALTA', true),
  ('L03', 'Loja 03 - Goiabeiras', 'loja', 'GOIABEIRAS', true),
  ('L04', 'Loja 04 - Jardim Cuiabá', 'loja', 'JARDIM CUIABÁ', true),
  ('L05', 'Loja 05 - CPA', 'loja', 'CPA', true),
  ('CP', 'Central de Produção', 'central', 'CENTRAL PRODUÇÃO', true),
  ('CD', 'Central de Distribuição', 'central', 'CD', true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, location = EXCLUDED.location, active = EXCLUDED.active;

INSERT INTO public.checklist_templates (name, unit_type, period, role_target, active) VALUES
  ('Checklist Loja - Abertura', 'loja', 'abertura', 'gerente', true),
  ('Checklist Loja - Durante o Dia', 'loja', 'durante', 'gerente', true),
  ('Checklist Loja - Fechamento', 'loja', 'fechamento', 'gerente', true),
  ('Checklist CP - Produção Dia', 'cp', 'producao_dia', 'gerente', true),
  ('Checklist CD - Operação CD', 'cd', 'operacao_cd', 'encarregado', true)
ON CONFLICT (name) DO UPDATE SET unit_type = EXCLUDED.unit_type, period = EXCLUDED.period, role_target = EXCLUDED.role_target, active = EXCLUDED.active;

WITH all_templates AS (
  SELECT id, name FROM public.checklist_templates WHERE name IN ('Checklist Loja - Abertura','Checklist Loja - Durante o Dia','Checklist Loja - Fechamento','Checklist CP - Produção Dia','Checklist CD - Operação CD')
)
INSERT INTO public.checklist_items (template_id, ordem, descricao, obrigatorio, tipo_resposta)
SELECT at.id, v.ordem, v.descricao, true, v.tipo_resposta::public.checklist_response_type
FROM all_templates at
JOIN (VALUES
  ('Checklist Loja - Abertura', 1, 'Conferir limpeza geral da loja', 'foto'),
  ('Checklist Loja - Abertura', 2, 'Conferir uniformes da equipe presente', 'sim_nao'),
  ('Checklist Loja - Abertura', 3, 'Verificar abastecimento de gôndolas críticas (FLV, açougue, padaria)', 'sim_nao'),
  ('Checklist Loja - Abertura', 4, 'Conferir preços e cartazeamento de ofertas do dia', 'sim_nao'),
  ('Checklist Loja - Abertura', 5, 'Verificar funcionamento de freezers e câmaras (anotar temperatura)', 'texto'),
  ('Checklist Loja - Abertura', 6, 'Reunião rápida com encarregados (5 min) — confirmar prioridades do dia', 'sim_nao'),
  ('Checklist Loja - Abertura', 7, 'Confirmar abertura no horário com caixas operantes', 'sim_nao'),
  ('Checklist Loja - Durante o Dia', 1, 'Verificar quebras/perdas até 11h (anotar valor)', 'texto'),
  ('Checklist Loja - Durante o Dia', 2, 'Conferir reposição de gôndolas após pico da manhã', 'sim_nao'),
  ('Checklist Loja - Durante o Dia', 3, 'Acompanhar atendimento na frente de caixa', 'sim_nao'),
  ('Checklist Loja - Durante o Dia', 4, 'Conferir validade próxima dos perecíveis', 'sim_nao'),
  ('Checklist Loja - Durante o Dia', 5, 'Resolver pelo menos 1 problema operacional do dia (B.O.)', 'sim_nao'),
  ('Checklist Loja - Durante o Dia', 6, 'Treinar/orientar 1 colaborador (registrar quem)', 'texto'),
  ('Checklist Loja - Fechamento', 1, 'Conferir limpeza pós-movimento', 'sim_nao'),
  ('Checklist Loja - Fechamento', 2, 'Reposição emergencial pra próxima abertura', 'sim_nao'),
  ('Checklist Loja - Fechamento', 3, 'Conferir caixa e sangria', 'sim_nao'),
  ('Checklist Loja - Fechamento', 4, 'Trancar áreas restritas', 'sim_nao'),
  ('Checklist Loja - Fechamento', 5, 'Anotar pendências pro dia seguinte', 'texto'),
  ('Checklist Loja - Fechamento', 6, 'Reportar venda do dia no app (valor)', 'texto'),
  ('Checklist CP - Produção Dia', 1, 'Receber demanda das 4 lojas até 6:00', 'sim_nao'),
  ('Checklist CP - Produção Dia', 2, 'Conferir estoque de farinha/insumos', 'sim_nao'),
  ('Checklist CP - Produção Dia', 3, 'Iniciar fornadas conforme cronograma', 'sim_nao'),
  ('Checklist CP - Produção Dia', 4, 'Conferir qualidade visual antes do despacho', 'sim_nao'),
  ('Checklist CP - Produção Dia', 5, 'Despachar pedido pra cada loja com etiqueta de horário', 'sim_nao'),
  ('Checklist CP - Produção Dia', 6, 'Anotar quebras de produção', 'texto'),
  ('Checklist CD - Operação CD', 1, 'Receber e conferir mercadoria do fornecedor', 'sim_nao'),
  ('Checklist CD - Operação CD', 2, 'Separar pedidos das 4 lojas', 'sim_nao'),
  ('Checklist CD - Operação CD', 3, 'Despachar com nota e horário', 'sim_nao'),
  ('Checklist CD - Operação CD', 4, 'Conferir validade dos produtos em estoque', 'sim_nao'),
  ('Checklist CD - Operação CD', 5, 'Reportar avarias', 'foto')
) AS v(template_name, ordem, descricao, tipo_resposta) ON v.template_name = at.name
ON CONFLICT (template_id, ordem) DO UPDATE SET descricao = EXCLUDED.descricao, tipo_resposta = EXCLUDED.tipo_resposta;

UPDATE public.profiles SET role = cargo WHERE role IS NULL;

UPDATE public.profiles p SET unit_id = u.id, permission_units = ARRAY[u.id]
FROM public.units u
WHERE p.unit_id IS NULL AND p.unidade::text = u.location;

UPDATE public.profiles p SET permission_units = (SELECT array_agg(id) FROM public.units)
WHERE p.cargo IN ('admin', 'master', 'supervisor');