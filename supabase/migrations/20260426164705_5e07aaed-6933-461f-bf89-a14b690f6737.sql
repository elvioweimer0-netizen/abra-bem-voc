CREATE TABLE IF NOT EXISTS public.document_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL UNIQUE,
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT 'Outros',
  content_template text NOT NULL,
  required_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  approval_flow jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL REFERENCES public.document_templates(type),
  colaborador_id uuid REFERENCES public.team_members(id),
  criado_por uuid NOT NULL DEFAULT auth.uid(),
  dados_jsonb jsonb NOT NULL DEFAULT '{}'::jsonb,
  pdf_url text,
  status text NOT NULL DEFAULT 'rascunho',
  motivo_rejeicao text,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  finalizado_em timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_approvals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  role_required text NOT NULL,
  aprovado_por uuid,
  status text NOT NULL DEFAULT 'pendente',
  motivo text,
  decidido_em timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_criado_por ON public.documents(criado_por);
CREATE INDEX IF NOT EXISTS idx_documents_colaborador_id ON public.documents(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_document_approvals_document_id ON public.document_approvals(document_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_role_status ON public.document_approvals(role_required, status);

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_approvals ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_central_adm_area(_user_id uuid, _area text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    LEFT JOIN public.units u ON u.id = p.unit_id
    WHERE p.user_id = _user_id
      AND (
        public.has_role(_user_id, 'admin')
        OR public.has_role(_user_id, 'master')
        OR (
          (p.unidade = 'CENTRAL PRODUÇÃO' OR u.type = 'central' OR lower(coalesce(u.code, '')) IN ('central_adm', 'central'))
          AND lower(coalesce(p.cargo_titulo, '') || ' ' || coalesce(p.descricao, '') || ' ' || coalesce(p.nome, '')) LIKE '%' || lower(_area) || '%'
        )
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_review_document_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _role = 'admin' THEN public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'master')
    WHEN _role = 'rh' THEN public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'master') OR public.is_central_adm_area(_user_id, 'rh')
    WHEN _role = 'dp' THEN public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'master') OR public.is_central_adm_area(_user_id, 'dp') OR public.is_central_adm_area(_user_id, 'departamento pessoal')
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.can_view_document(_user_id uuid, _document_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.documents d
    LEFT JOIN public.team_members tm ON tm.id = d.colaborador_id
    WHERE d.id = _document_id
      AND (
        d.criado_por = _user_id
        OR public.has_role(_user_id, 'admin')
        OR public.has_role(_user_id, 'master')
        OR public.has_role(_user_id, 'supervisor')
        OR (tm.unit_id IS NOT NULL AND public.user_can_access_unit(_user_id, tm.unit_id))
        OR EXISTS (
          SELECT 1 FROM public.document_approvals da
          WHERE da.document_id = d.id AND public.can_review_document_role(_user_id, da.role_required)
        )
      )
  )
$$;

CREATE POLICY "Leadership can view active document templates"
ON public.document_templates
FOR SELECT
TO authenticated
USING (active = true AND public.is_leadership(auth.uid()));

CREATE POLICY "Admins can manage document templates"
ON public.document_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

CREATE POLICY "Leadership can create documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (criado_por = auth.uid() AND public.is_leadership(auth.uid()));

CREATE POLICY "Users can view permitted documents"
ON public.documents
FOR SELECT
TO authenticated
USING (public.can_view_document(auth.uid(), id));

CREATE POLICY "Creators and reviewers can update documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (
  criado_por = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'master')
  OR EXISTS (SELECT 1 FROM public.document_approvals da WHERE da.document_id = documents.id AND public.can_review_document_role(auth.uid(), da.role_required))
)
WITH CHECK (
  criado_por = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'master')
  OR EXISTS (SELECT 1 FROM public.document_approvals da WHERE da.document_id = documents.id AND public.can_review_document_role(auth.uid(), da.role_required))
);

CREATE POLICY "Users can view permitted approvals"
ON public.document_approvals
FOR SELECT
TO authenticated
USING (public.can_view_document(auth.uid(), document_id) OR public.can_review_document_role(auth.uid(), role_required));

CREATE POLICY "Creators can create document approvals"
ON public.document_approvals
FOR INSERT
TO authenticated
WITH CHECK (public.can_view_document(auth.uid(), document_id));

CREATE POLICY "Reviewers can update approvals"
ON public.document_approvals
FOR UPDATE
TO authenticated
USING (public.can_review_document_role(auth.uid(), role_required))
WITH CHECK (public.can_review_document_role(auth.uid(), role_required));

CREATE TRIGGER update_document_templates_updated_at
BEFORE UPDATE ON public.document_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_approvals_updated_at
BEFORE UPDATE ON public.document_approvals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('leadership-documents', 'leadership-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Leadership can upload leadership documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'leadership-documents' AND public.is_leadership(auth.uid()));

CREATE POLICY "Leadership can view leadership documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'leadership-documents' AND public.is_leadership(auth.uid()));

INSERT INTO public.document_templates (type, titulo, descricao, categoria, content_template, required_fields, approval_flow) VALUES
('advertencia_verbal', 'Advertência Verbal', 'Registro disciplinar verbal automático no RH.', 'Disciplina', 'Pela presente, fica formalmente registrada advertência verbal ao colaborador {{nome}}, ocupante do cargo de {{cargo}}, lotado no setor {{setor}}, em virtude de {{motivo}}. Local: {{unidade}}, data {{data}}.', '[{"name":"motivo","label":"Motivo","type":"textarea"},{"name":"data","label":"Data","type":"date"}]', '[]'),
('advertencia_escrita', 'Advertência Escrita', 'Registro disciplinar escrito automático no RH.', 'Disciplina', 'Pela presente, fica formalmente registrada advertência escrita ao colaborador {{nome}}, ocupante do cargo de {{cargo}}, lotado no setor {{setor}}, unidade {{unidade}}, em razão de {{motivo}}. O colaborador fica cientificado de que a reincidência poderá acarretar medidas disciplinares mais severas. Data {{data}}.', '[{"name":"motivo","label":"Motivo","type":"textarea"},{"name":"data","label":"Data","type":"date"}]', '[]'),
('suspensao', 'Suspensão', 'Documento formal de suspensão disciplinar.', 'Disciplina', 'Comunicamos a suspensão disciplinar do colaborador {{nome}}, cargo {{cargo}}, setor {{setor}}, unidade {{unidade}}, pelo período de {{periodo}}, em virtude de {{motivo}}. Durante este período, o colaborador deverá afastar-se de suas atividades, retornando conforme orientação da liderança. Data {{data}}.', '[{"name":"motivo","label":"Motivo","type":"textarea"},{"name":"periodo","label":"Período","type":"text"},{"name":"data","label":"Data","type":"date"}]', '[]'),
('admissao_substituicao', 'Solicitação Admissão por Substituição', 'Pedido de contratação para substituir colaborador desligado.', 'Admissão', 'Solicito abertura de processo admissional por substituição para o cargo de {{cargo}}, setor {{setor}}, unidade {{unidade}}, em razão de {{motivo}}. A vaga substitui {{substituido}} e é necessária para manutenção da operação. Data {{data}}.', '[{"name":"cargo","label":"Cargo","type":"text"},{"name":"setor","label":"Setor","type":"text"},{"name":"motivo","label":"Motivo","type":"textarea"},{"name":"substituido","label":"Substitui quem saiu","type":"text"},{"name":"data","label":"Data","type":"date"}]', '["rh","dp"]'),
('admissao_vaga_nova', 'Solicitação Admissão Vaga Nova', 'Pedido de contratação para nova vaga.', 'Admissão', 'Solicito aprovação para abertura de vaga nova para o cargo de {{cargo}}, setor {{setor}}, unidade {{unidade}}. Justificativa: {{justificativa}}. A contratação visa atender à demanda operacional descrita. Data {{data}}.', '[{"name":"cargo","label":"Cargo","type":"text"},{"name":"setor","label":"Setor","type":"text"},{"name":"justificativa","label":"Justificativa","type":"textarea"},{"name":"data","label":"Data","type":"date"}]', '["admin","dp"]'),
('desligamento_justa_causa', 'Solicitação Desligamento Justa Causa', 'Pedido de desligamento por justa causa.', 'Desligamento', 'Solicito análise para desligamento por justa causa do colaborador {{nome}}, cargo {{cargo}}, setor {{setor}}, unidade {{unidade}}, em razão de {{motivo}}. Evidências apresentadas: {{evidencias}}. Data {{data}}.', '[{"name":"motivo","label":"Motivo","type":"textarea"},{"name":"evidencias","label":"Evidências","type":"textarea"},{"name":"data","label":"Data","type":"date"}]', '["rh","dp"]'),
('desligamento_pedido_demissao', 'Solicitação Desligamento Pedido de Demissão', 'Registro de pedido de demissão.', 'Desligamento', 'Encaminho solicitação de desligamento por pedido de demissão do colaborador {{nome}}, cargo {{cargo}}, setor {{setor}}, unidade {{unidade}}, com pedido registrado em {{data_pedido}}. Data {{data}}.', '[{"name":"data_pedido","label":"Data do pedido","type":"date"},{"name":"data","label":"Data","type":"date"}]', '["rh","dp"]'),
('desligamento_fim_experiencia', 'Solicitação Desligamento Fim de Experiência', 'Pedido de encerramento no fim de experiência.', 'Desligamento', 'Solicito encerramento do contrato de experiência do colaborador {{nome}}, cargo {{cargo}}, setor {{setor}}, unidade {{unidade}}, com término previsto em {{data_fim}}. Data {{data}}.', '[{"name":"data_fim","label":"Data fim","type":"date"},{"name":"data","label":"Data","type":"date"}]', '["rh","dp"]'),
('desligamento_sem_justa_causa', 'Solicitação Desligamento Sem Justa Causa', 'Pedido de desligamento sem justa causa.', 'Desligamento', 'Solicito aprovação para desligamento sem justa causa do colaborador {{nome}}, cargo {{cargo}}, setor {{setor}}, unidade {{unidade}}. Motivo gerencial: {{motivo}}. Data {{data}}.', '[{"name":"motivo","label":"Motivo","type":"textarea"},{"name":"data","label":"Data","type":"date"}]', '["admin","dp"]'),
('aviso_previo', 'Aviso Prévio', 'Documento formal de aviso prévio.', 'Outros', 'Fica formalizado o aviso prévio referente ao colaborador {{nome}}, cargo {{cargo}}, setor {{setor}}, unidade {{unidade}}, conforme motivo: {{motivo}}. O período informado é {{periodo}}. Data {{data}}.', '[{"name":"motivo","label":"Motivo","type":"textarea"},{"name":"periodo","label":"Período","type":"text"},{"name":"data","label":"Data","type":"date"}]', '["rh","dp"]'),
('declaracao_trabalho', 'Atestado/Declaração de Trabalho', 'Declaração formal de vínculo e função.', 'Outros', 'Declaramos para os devidos fins que {{nome}}, ocupante do cargo de {{cargo}}, setor {{setor}}, unidade {{unidade}}, integra o quadro de colaboradores do Supermercado Curió. Finalidade: {{finalidade}}. Data {{data}}.', '[{"name":"finalidade","label":"Finalidade","type":"textarea"},{"name":"data","label":"Data","type":"date"}]', '["rh"]')
ON CONFLICT (type) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao = EXCLUDED.descricao,
  categoria = EXCLUDED.categoria,
  content_template = EXCLUDED.content_template,
  required_fields = EXCLUDED.required_fields,
  approval_flow = EXCLUDED.approval_flow,
  active = true,
  updated_at = now();