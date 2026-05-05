
-- 1) units.unit_kind
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS unit_kind text;
ALTER TABLE public.units DROP CONSTRAINT IF EXISTS units_unit_kind_check;
ALTER TABLE public.units ADD CONSTRAINT units_unit_kind_check
  CHECK (unit_kind IS NULL OR unit_kind IN ('loja','cp','cd','cpa','adm'));

UPDATE public.units SET unit_kind = CASE
  WHEN code = 'L05' THEN 'cpa'
  WHEN code IN ('L01','L03','L04') THEN 'loja'
  WHEN code = 'CP' THEN 'cp'
  WHEN code = 'CD' THEN 'cd'
  WHEN code = 'CENTRAL_ADM' THEN 'adm'
  ELSE 'loja'
END
WHERE unit_kind IS NULL;

ALTER TABLE public.units ALTER COLUMN unit_kind SET DEFAULT 'loja';
ALTER TABLE public.units ALTER COLUMN unit_kind SET NOT NULL;

-- 2) unit_sector_templates
CREATE TABLE IF NOT EXISTS public.unit_sector_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  unit_kind text NOT NULL CHECK (unit_kind IN ('loja','cp','cd','cpa','adm')),
  sector_name text NOT NULL,
  ordem smallint NOT NULL DEFAULT 99,
  icon text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ust_kind ON public.unit_sector_templates(unit_kind);
CREATE INDEX IF NOT EXISTS idx_ust_unit ON public.unit_sector_templates(unit_id);

ALTER TABLE public.unit_sector_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ust_select_auth" ON public.unit_sector_templates;
CREATE POLICY "ust_select_auth" ON public.unit_sector_templates
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ust_write_admin" ON public.unit_sector_templates;
CREATE POLICY "ust_write_admin" ON public.unit_sector_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin'));

-- 3) Seed (idempotent: clean global templates first)
DELETE FROM public.unit_sector_templates WHERE unit_id IS NULL;

INSERT INTO public.unit_sector_templates (unit_kind, sector_name, ordem, icon) VALUES
  -- CP
  ('cp','Pão Francês',1,'wheat'),
  ('cp','Pão Embalado',2,'package'),
  ('cp','Cozinha',3,'chef-hat'),
  ('cp','Salgado',4,'utensils'),
  ('cp','Confeitaria',5,'cake'),
  ('cp','Apoio/Logística',6,'truck'),
  -- CD
  ('cd','Administrativo',1,'clipboard'),
  ('cd','Operacional',2,'package'),
  -- LOJA
  ('loja','Açougue',1,'beef'),
  ('loja','Padaria',2,'wheat'),
  ('loja','Frente de Caixa',3,'shopping-cart'),
  ('loja','Repositores',4,'package'),
  ('loja','Recebimento e Perdas',5,'clipboard-check'),
  ('loja','Vigia',6,'shield'),
  ('loja','Prevenção',7,'eye'),
  ('loja','Manutenção e Limpeza',8,'spray-can'),
  ('loja','Sushi/Atendimento',9,'smile'),
  -- CPA
  ('cpa','Açougue',1,'beef'),
  ('cpa','Padaria',2,'wheat'),
  ('cpa','Frente de Caixa',3,'shopping-cart'),
  ('cpa','Repositores e Hortifruti',4,'apple'),
  ('cpa','Recebimento e Perdas',5,'clipboard-check'),
  ('cpa','Vigia e Limpeza',6,'shield'),
  -- ADM
  ('adm','Diretoria',1,'crown'),
  ('adm','Financeiro',2,'dollar-sign'),
  ('adm','Recursos Humanos',3,'users'),
  ('adm','Tecnologia',4,'cpu');
