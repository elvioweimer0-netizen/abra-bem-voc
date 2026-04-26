ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS welcome_banner_dismissed BOOLEAN NOT NULL DEFAULT false;

UPDATE public.profiles
SET first_login_at = COALESCE(first_login_at, created_at, now())
WHERE first_login_at IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, unidade, cargo, username, must_change_password, first_login_at, welcome_banner_dismissed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'unidade')::unidade_tipo, 'CIDADE ALTA'),
    COALESCE((NEW.raw_user_meta_data->>'cargo')::cargo_tipo, 'colaborador'),
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false),
    now(),
    false
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'cargo')::cargo_tipo, 'colaborador')
  );
  RETURN NEW;
END;
$function$;