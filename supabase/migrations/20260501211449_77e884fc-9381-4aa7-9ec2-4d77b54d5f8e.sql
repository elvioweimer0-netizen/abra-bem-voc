-- Restore profiles RLS policies (dropped by enum CASCADE in earlier migration)

-- Everyone authenticated can read profiles (needed for app to work; matches pre-existing behavior)
CREATE POLICY "Authenticated can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins/master can update any profile
CREATE POLICY "Admins update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo))
WITH CHECK (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo));

-- Admins/master can insert profiles
CREATE POLICY "Admins insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo));

-- Allow handle_new_user trigger (runs as definer) to insert; also allow self-insert as fallback
CREATE POLICY "Self insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());