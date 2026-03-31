
-- Rename existing enum values to new unidades
ALTER TYPE public.unidade_tipo RENAME VALUE 'UND 1' TO 'CIDADE ALTA';
ALTER TYPE public.unidade_tipo RENAME VALUE 'UND 2' TO 'GOIABEIRAS';
ALTER TYPE public.unidade_tipo RENAME VALUE 'UND 3' TO 'JARDIM CUIABÁ';
ALTER TYPE public.unidade_tipo RENAME VALUE 'UND 4' TO 'CPA';
ALTER TYPE public.unidade_tipo RENAME VALUE 'Central de Produção' TO 'CENTRAL PRODUÇÃO';
ALTER TYPE public.unidade_tipo RENAME VALUE 'Centro de Distribuição' TO 'CD';
