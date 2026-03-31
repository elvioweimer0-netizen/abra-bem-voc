
-- Update get_user_departamento to read from renamed column 'setor'
CREATE OR REPLACE FUNCTION public.get_user_departamento(_user_id uuid)
RETURNS setor_tipo
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT setor FROM profiles WHERE user_id = _user_id $$;
