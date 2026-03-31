
ALTER TYPE cargo_tipo ADD VALUE IF NOT EXISTS 'master';
ALTER TYPE cargo_tipo ADD VALUE IF NOT EXISTS 'adm_departamento';
ALTER TYPE cargo_tipo ADD VALUE IF NOT EXISTS 'supervisor';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS departamento setor_tipo;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;
