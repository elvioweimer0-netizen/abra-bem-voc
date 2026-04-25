DROP POLICY IF EXISTS "Anyone can view gallery images" ON storage.objects;

CREATE POLICY "Authenticated users can view gallery images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'galeria');