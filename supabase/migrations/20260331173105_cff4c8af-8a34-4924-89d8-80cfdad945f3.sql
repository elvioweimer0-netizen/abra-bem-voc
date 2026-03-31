
-- Rename departamento to setor
ALTER TABLE public.profiles RENAME COLUMN departamento TO setor;

-- Set default for gerencia, update existing nulls, then make NOT NULL
ALTER TABLE public.profiles ALTER COLUMN gerencia SET DEFAULT 'OPERACAO'::gerencia_tipo;
UPDATE public.profiles SET gerencia = 'OPERACAO'::gerencia_tipo WHERE gerencia IS NULL;
ALTER TABLE public.profiles ALTER COLUMN gerencia SET NOT NULL;

-- Add unique constraints if not exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_id') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT unique_user_id UNIQUE (user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_email') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT unique_email UNIQUE (email);
  END IF;
END $$;
