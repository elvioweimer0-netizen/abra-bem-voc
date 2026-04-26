ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cargo_titulo text,
ADD COLUMN IF NOT EXISTS descricao text,
ADD COLUMN IF NOT EXISTS foto_url text,
ADD COLUMN IF NOT EXISTS telefone text,
ADD COLUMN IF NOT EXISTS data_admissao date;

ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS descricao text;

CREATE INDEX IF NOT EXISTS idx_profiles_cargo_titulo ON public.profiles(cargo_titulo);
CREATE INDEX IF NOT EXISTS idx_profiles_foto_url ON public.profiles(foto_url);
CREATE INDEX IF NOT EXISTS idx_team_members_descricao ON public.team_members(descricao);

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Profile photos are publicly visible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users upload their own profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update their own profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete their own profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);