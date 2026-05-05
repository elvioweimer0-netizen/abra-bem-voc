ALTER TABLE public.units ADD COLUMN IF NOT EXISTS total_desejado SMALLINT NOT NULL DEFAULT 0;

UPDATE public.units SET total_desejado = 46 WHERE code = 'MATRIZ' OR code = 'L01' OR name ILIKE '%cidade alta%';

DROP POLICY IF EXISTS "Admins can update units" ON public.units;
CREATE POLICY "Admins can update units"
ON public.units
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));