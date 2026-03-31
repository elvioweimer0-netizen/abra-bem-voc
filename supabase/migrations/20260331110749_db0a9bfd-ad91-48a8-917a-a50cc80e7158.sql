
-- advertencias.tipo: usar abordagem de nova coluna
ALTER TABLE public.advertencias ADD COLUMN tipo_new public.advertencia_tipo;
UPDATE public.advertencias SET tipo_new = tipo::public.advertencia_tipo;
ALTER TABLE public.advertencias DROP COLUMN tipo;
ALTER TABLE public.advertencias RENAME COLUMN tipo_new TO tipo;
ALTER TABLE public.advertencias ALTER COLUMN tipo SET NOT NULL;

-- ocorrencias.status: usar abordagem de nova coluna
ALTER TABLE public.ocorrencias ADD COLUMN status_new public.ocorrencia_status DEFAULT 'aberta'::public.ocorrencia_status;
UPDATE public.ocorrencias SET status_new = status::public.ocorrencia_status;
ALTER TABLE public.ocorrencias DROP COLUMN status;
ALTER TABLE public.ocorrencias RENAME COLUMN status_new TO status;
ALTER TABLE public.ocorrencias ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.ocorrencias ALTER COLUMN status SET DEFAULT 'aberta'::public.ocorrencia_status;

-- Recriar índices
CREATE INDEX IF NOT EXISTS idx_ocorrencias_status ON public.ocorrencias(status);
