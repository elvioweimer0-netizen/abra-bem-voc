
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS pis text,
  ADD COLUMN IF NOT EXISTS cbo text,
  ADD COLUMN IF NOT EXISTS codigo_empregado text,
  ADD COLUMN IF NOT EXISTS setor_text text,
  ADD COLUMN IF NOT EXISTS cargo_text text,
  ADD COLUMN IF NOT EXISTS admissao_date date,
  ADD COLUMN IF NOT EXISTS nascimento_date date,
  ADD COLUMN IF NOT EXISTS sexo text,
  ADD COLUMN IF NOT EXISTS periodo text,
  ADD COLUMN IF NOT EXISTS pcd_flag boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS afastado_status text,
  ADD COLUMN IF NOT EXISTS afastado_desde date,
  ADD COLUMN IF NOT EXISTS is_general_manager boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS posicao_organograma text,
  ADD COLUMN IF NOT EXISTS setor_organograma text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_unique ON public.profiles(cpf) WHERE cpf IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.bulk_import_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name text,
  total_rows int DEFAULT 0,
  successful int DEFAULT 0,
  updated int DEFAULT 0,
  failed int DEFAULT 0,
  details jsonb,
  performed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_import_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read import log" ON public.bulk_import_log;
CREATE POLICY "Admins read import log" ON public.bulk_import_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Admins insert import log" ON public.bulk_import_log;
CREATE POLICY "Admins insert import log" ON public.bulk_import_log FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));
