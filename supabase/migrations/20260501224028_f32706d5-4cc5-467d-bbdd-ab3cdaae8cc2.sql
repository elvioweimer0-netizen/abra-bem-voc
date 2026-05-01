
BEGIN;

-- ============================================================
-- FEATURE 1: Confirmação de leitura em avisos
-- ============================================================

ALTER TABLE public.avisos
  ADD COLUMN IF NOT EXISTS criado_por uuid DEFAULT auth.uid();

CREATE TABLE IF NOT EXISTS public.aviso_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aviso_id uuid NOT NULL REFERENCES public.avisos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (aviso_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_aviso_reads_aviso ON public.aviso_reads(aviso_id);
CREATE INDEX IF NOT EXISTS idx_aviso_reads_user ON public.aviso_reads(user_id);

ALTER TABLE public.aviso_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users mark own read" ON public.aviso_reads;
CREATE POLICY "Users mark own read" ON public.aviso_reads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own read" ON public.aviso_reads;
CREATE POLICY "Users delete own read" ON public.aviso_reads
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "View own reads" ON public.aviso_reads;
CREATE POLICY "View own reads" ON public.aviso_reads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Aviso author views reads" ON public.aviso_reads;
CREATE POLICY "Aviso author views reads" ON public.aviso_reads
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.avisos a WHERE a.id = aviso_reads.aviso_id AND a.criado_por = auth.uid()));

DROP POLICY IF EXISTS "Leaders view all reads" ON public.aviso_reads;
CREATE POLICY "Leaders view all reads" ON public.aviso_reads
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::cargo_tipo)
    OR has_role(auth.uid(), 'master'::cargo_tipo)
    OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
  );

-- ============================================================
-- FEATURE 2: Foto obrigatória no checklist
-- ============================================================

ALTER TABLE public.checklist_items
  ADD COLUMN IF NOT EXISTS requires_photo boolean NOT NULL DEFAULT false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('checklist-photos', 'checklist-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Checklist photos: owner upload" ON storage.objects;
CREATE POLICY "Checklist photos: owner upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'checklist-photos'
    AND auth.uid()::text = (storage.foldername(name))[2]
    AND user_can_access_unit(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "Checklist photos: owner delete" ON storage.objects;
CREATE POLICY "Checklist photos: owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'checklist-photos'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

DROP POLICY IF EXISTS "Checklist photos: owner read" ON storage.objects;
CREATE POLICY "Checklist photos: owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'checklist-photos'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

DROP POLICY IF EXISTS "Checklist photos: unit leaders read" ON storage.objects;
CREATE POLICY "Checklist photos: unit leaders read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'checklist-photos'
    AND (
      has_role(auth.uid(), 'admin'::cargo_tipo)
      OR has_role(auth.uid(), 'master'::cargo_tipo)
      OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
      OR (
        is_leadership(auth.uid())
        AND user_can_access_unit(auth.uid(), ((storage.foldername(name))[1])::uuid)
      )
    )
  );

-- ============================================================
-- FEATURE 3: Semáforo de execução (view)
-- ============================================================

CREATE OR REPLACE VIEW public.v_unit_checklist_progress AS
SELECT
  u.id        AS unit_id,
  u.name      AS unit_name,
  u.code      AS unit_code,
  CURRENT_DATE AS data,
  COALESCE(SUM(agg.item_total), 0)::int AS total_items,
  COALESCE(SUM(agg.item_done),  0)::int AS done_items,
  CASE
    WHEN COALESCE(SUM(agg.item_total), 0) = 0 THEN NULL
    ELSE ROUND(100.0 * SUM(agg.item_done)::numeric / NULLIF(SUM(agg.item_total), 0), 0)
  END AS pct
FROM public.units u
LEFT JOIN public.checklist_completions c
  ON c.unit_id = u.id AND c.data = CURRENT_DATE
LEFT JOIN LATERAL (
  SELECT
    (SELECT COUNT(*) FROM public.checklist_items i WHERE i.template_id = c.template_id) AS item_total,
    (SELECT COUNT(*) FROM public.checklist_item_responses r
       WHERE r.completion_id = c.id AND r.completed_at IS NOT NULL) AS item_done
) agg ON true
GROUP BY u.id, u.name, u.code;

GRANT SELECT ON public.v_unit_checklist_progress TO authenticated;

-- ============================================================
-- FEATURE 4: Mural Curió de Ouro (policies aditivas)
-- ============================================================

DROP POLICY IF EXISTS "Public praises visible to all" ON public.praises;
CREATE POLICY "Public praises visible to all" ON public.praises
  FOR SELECT TO authenticated
  USING (publico = true);

DROP POLICY IF EXISTS "Applause on public praises visible to all" ON public.praise_applause;
CREATE POLICY "Applause on public praises visible to all" ON public.praise_applause
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.praises p WHERE p.id = praise_applause.praise_id AND p.publico = true)
  );

DROP POLICY IF EXISTS "Users applaud public praises" ON public.praise_applause;
CREATE POLICY "Users applaud public praises" ON public.praise_applause
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.praises p WHERE p.id = praise_applause.praise_id AND p.publico = true)
  );

COMMIT;
