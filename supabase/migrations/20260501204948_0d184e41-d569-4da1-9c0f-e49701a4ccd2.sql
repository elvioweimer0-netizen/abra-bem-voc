-- Restaurar coluna cargo em colaboradores (foi dropada via CASCADE)
ALTER TABLE public.colaboradores 
  ADD COLUMN IF NOT EXISTS cargo public.cargo_tipo NOT NULL DEFAULT 'colaborador'::public.cargo_tipo;

-- Recriar policies de colaboradores (foram dropadas via CASCADE)
DROP POLICY IF EXISTS "Authenticated users can view colaboradores of their unit" ON public.colaboradores;
DROP POLICY IF EXISTS "Admins and managers can insert colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Admins and managers can update colaboradores" ON public.colaboradores;

CREATE POLICY "Authenticated users can view colaboradores of their unit" 
ON public.colaboradores FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) 
  OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR (unidade = get_user_unidade(auth.uid()))
);

CREATE POLICY "Admins and managers can insert colaboradores"
ON public.colaboradores FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR ((has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo)) AND (unidade = get_user_unidade(auth.uid())))
);

CREATE POLICY "Admins and managers can update colaboradores"
ON public.colaboradores FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::cargo_tipo)
  OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR ((has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo)) AND (unidade = get_user_unidade(auth.uid())))
);

ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;