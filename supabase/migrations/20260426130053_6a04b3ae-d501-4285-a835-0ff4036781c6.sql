DROP POLICY IF EXISTS "Profile photos are publicly visible" ON storage.objects;

UPDATE storage.buckets
SET public = false
WHERE id = 'profile-photos';

CREATE POLICY "Users view their own profile photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);