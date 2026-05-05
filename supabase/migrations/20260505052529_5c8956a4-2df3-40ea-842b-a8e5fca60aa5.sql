
-- Storage bucket for master weekly reports (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('master-reports', 'master-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Only master/admin/supervisor can read master reports via signed URLs
CREATE POLICY "Master reports admin read" ON storage.objects FOR SELECT
USING (
  bucket_id = 'master-reports'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.cargo IN ('master','admin','supervisor')
  )
);

CREATE POLICY "Master reports service write" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'master-reports');
