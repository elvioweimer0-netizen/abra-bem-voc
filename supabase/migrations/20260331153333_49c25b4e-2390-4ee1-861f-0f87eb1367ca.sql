
-- Helper function for departamento lookup
CREATE OR REPLACE FUNCTION public.get_user_departamento(_user_id uuid)
RETURNS setor_tipo
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT departamento FROM profiles WHERE user_id = _user_id $$;

-- Security trigger: prevent unauthorized role escalation
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'master' AND NOT has_role(auth.uid(), 'master') THEN
    RAISE EXCEPTION 'Apenas master pode atribuir perfil master';
  END IF;
  IF NEW.role IN ('master', 'admin') AND NOT (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Permissão insuficiente para atribuir este perfil';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_role_change ON user_roles;
CREATE TRIGGER check_role_change BEFORE INSERT OR UPDATE ON user_roles
FOR EACH ROW EXECUTE FUNCTION validate_role_change();

-- Consolidate profiles SELECT policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Managers can view unit profiles" ON profiles;
DROP POLICY IF EXISTS "Leaders can view unit profiles" ON profiles;

CREATE POLICY "View profiles" ON profiles FOR SELECT TO public
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'master')
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'adm_departamento')
  OR has_role(auth.uid(), 'supervisor')
  OR (has_role(auth.uid(), 'gerente') AND unidade = get_user_unidade(auth.uid()))
  OR (has_role(auth.uid(), 'lider') AND unidade = get_user_unidade(auth.uid()))
);

-- Consolidate profiles UPDATE policies
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Update profiles" ON profiles FOR UPDATE TO public
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'master')
  OR has_role(auth.uid(), 'admin')
  OR (has_role(auth.uid(), 'adm_departamento')
      AND get_user_departamento(auth.uid()) IS NOT NULL
      AND departamento = get_user_departamento(auth.uid()))
);

-- Consolidate profiles INSERT policy
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Insert profiles" ON profiles FOR INSERT TO public
WITH CHECK (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin'));

-- Update user_roles management policy
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Management can manage roles" ON user_roles FOR ALL TO public
USING (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'adm_departamento'));
