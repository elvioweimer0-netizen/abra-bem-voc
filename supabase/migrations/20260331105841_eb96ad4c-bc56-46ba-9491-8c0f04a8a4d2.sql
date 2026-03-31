
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, unidade, cargo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'unidade')::unidade_tipo, 'CIDADE ALTA'),
    COALESCE((NEW.raw_user_meta_data->>'cargo')::cargo_tipo, 'colaborador')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'cargo')::cargo_tipo, 'colaborador')
  );
  RETURN NEW;
END;
$function$;
