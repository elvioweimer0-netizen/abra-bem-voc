-- Add new cargo types: gerente_adm and gerente_loja
ALTER TYPE public.cargo_tipo ADD VALUE IF NOT EXISTS 'gerente_adm';
ALTER TYPE public.cargo_tipo ADD VALUE IF NOT EXISTS 'gerente_loja';