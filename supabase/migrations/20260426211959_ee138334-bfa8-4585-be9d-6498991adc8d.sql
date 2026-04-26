ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS login_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_login_count(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE public.profiles
  SET login_count = COALESCE(login_count, 0) + 1,
      updated_at = now()
  WHERE user_id = _user_id
    AND _user_id = auth.uid()
  RETURNING login_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, unidade, cargo, username, must_change_password, first_login_at, welcome_banner_dismissed, login_count)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'unidade')::unidade_tipo, 'CIDADE ALTA'),
    COALESCE((NEW.raw_user_meta_data->>'cargo')::cargo_tipo, 'colaborador'),
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false),
    now(),
    false,
    0
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'cargo')::cargo_tipo, 'colaborador')
  );
  RETURN NEW;
END;
$$;