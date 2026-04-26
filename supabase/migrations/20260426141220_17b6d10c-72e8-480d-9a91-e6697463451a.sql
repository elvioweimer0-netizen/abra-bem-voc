CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.role = 'master' AND NOT has_role(auth.uid(), 'master') THEN
    RAISE EXCEPTION 'Apenas master pode atribuir perfil master';
  END IF;
  IF NEW.role IN ('master', 'admin') AND NOT (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Permissão insuficiente para atribuir este perfil';
  END IF;
  RETURN NEW;
END;
$function$;