CREATE TABLE public.whatsapp_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id),
  raw_input text NOT NULL,
  summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_summaries_user_created ON public.whatsapp_summaries (user_id, created_at DESC);

ALTER TABLE public.whatsapp_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_insert_own" ON public.whatsapp_summaries
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "wa_select_own_or_admin" ON public.whatsapp_summaries
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  );

CREATE POLICY "wa_delete_own" ON public.whatsapp_summaries
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
