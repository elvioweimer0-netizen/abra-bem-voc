
CREATE TABLE IF NOT EXISTS public.org_alocacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  posicao text NOT NULL CHECK (posicao IN ('gerente_unidade','encarregado_loja','encarregado_setor','colaborador')),
  setor text CHECK (setor IS NULL OR setor IN ('GERENTE','ENCARREGADO_LOJA','FLV','PADARIA','ACOUGUE','MERCEARIA','FRENTE_CAIXA','RECEBIMENTO','LIMPEZA','VIGIA')),
  sub_setor text,
  ordem smallint NOT NULL DEFAULT 0,
  alocado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  alocado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_alocacoes_profile_unique UNIQUE (profile_id)
);

CREATE INDEX IF NOT EXISTS idx_org_alocacoes_unit ON public.org_alocacoes(unit_id);
CREATE INDEX IF NOT EXISTS idx_org_alocacoes_setor ON public.org_alocacoes(unit_id, setor);

ALTER TABLE public.org_alocacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_alocacoes_select_authenticated" ON public.org_alocacoes;
CREATE POLICY "org_alocacoes_select_authenticated"
  ON public.org_alocacoes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "org_alocacoes_modify_managers" ON public.org_alocacoes;
CREATE POLICY "org_alocacoes_modify_managers"
  ON public.org_alocacoes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND (
          p.cargo IN ('master','admin')
          OR (p.cargo = 'gerente_loja' AND p.unit_id = org_alocacoes.unit_id)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND (
          p.cargo IN ('master','admin')
          OR (p.cargo = 'gerente_loja' AND p.unit_id = org_alocacoes.unit_id)
        )
    )
  );

-- Reset Cidade Alta
UPDATE public.profiles
SET setor_organograma = NULL, posicao_organograma = NULL
WHERE unit_id = (SELECT id FROM public.units WHERE code = 'L01' LIMIT 1);
