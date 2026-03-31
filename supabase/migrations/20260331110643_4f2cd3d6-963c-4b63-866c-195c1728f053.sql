
-- Dropar índices que possam conflitar
DROP INDEX IF EXISTS idx_colaboradores_status;

-- colaboradores.status
ALTER TABLE public.colaboradores ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.colaboradores ALTER COLUMN status TYPE public.colaborador_status USING status::public.colaborador_status;
ALTER TABLE public.colaboradores ALTER COLUMN status SET DEFAULT 'ativo'::public.colaborador_status;
CREATE INDEX idx_colaboradores_status ON public.colaboradores(status);

-- colaboradores.cargo
ALTER TABLE public.colaboradores ALTER COLUMN cargo TYPE public.cargo_tipo USING cargo::public.cargo_tipo;
