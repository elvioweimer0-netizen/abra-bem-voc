
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'gerencia_tipo'
  ) THEN
    CREATE TYPE public.gerencia_tipo AS ENUM (
      'FINANCEIRO',
      'RECURSOS_HUMANOS',
      'DEPARTAMENTO_PESSOAL',
      'MARKETING',
      'TI',
      'OPERACAO',
      'CENTRAL_PRODUCAO',
      'CD',
      'MANUTENCAO'
    );
  END IF;
END
$$;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gerencia public.gerencia_tipo;
