CREATE TABLE IF NOT EXISTS public.meeting_minutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.leadership_meetings(id) ON DELETE CASCADE,
  recording_url TEXT,
  recording_file_path TEXT,
  transcript TEXT,
  executive_summary TEXT,
  decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  attention_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  sentiment TEXT CHECK (sentiment IN ('positivo', 'neutro', 'tenso')),
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_id)
);

CREATE TABLE IF NOT EXISTS public.meeting_action_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.leadership_meetings(id) ON DELETE CASCADE,
  minute_id UUID REFERENCES public.meeting_minutes(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  responsavel TEXT,
  prazo DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_meeting_id ON public.meeting_minutes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_meeting_id ON public.meeting_action_items(meeting_id);

ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leadership can view meeting minutes" ON public.meeting_minutes;
CREATE POLICY "Leadership can view meeting minutes"
ON public.meeting_minutes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leadership_meetings m
    WHERE m.id = meeting_minutes.meeting_id
      AND public.is_leadership(auth.uid())
      AND (m.unit_id IS NULL OR public.user_can_access_unit(auth.uid(), m.unit_id))
  )
);

DROP POLICY IF EXISTS "Leadership can create meeting minutes" ON public.meeting_minutes;
CREATE POLICY "Leadership can create meeting minutes"
ON public.meeting_minutes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leadership_meetings m
    WHERE m.id = meeting_minutes.meeting_id
      AND public.is_leadership(auth.uid())
      AND (m.unit_id IS NULL OR public.user_can_access_unit(auth.uid(), m.unit_id))
  )
);

DROP POLICY IF EXISTS "Leadership can update meeting minutes" ON public.meeting_minutes;
CREATE POLICY "Leadership can update meeting minutes"
ON public.meeting_minutes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leadership_meetings m
    WHERE m.id = meeting_minutes.meeting_id
      AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor') OR m.created_by = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leadership_meetings m
    WHERE m.id = meeting_minutes.meeting_id
      AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor') OR m.created_by = auth.uid())
  )
);

DROP POLICY IF EXISTS "Leadership can view meeting action items" ON public.meeting_action_items;
CREATE POLICY "Leadership can view meeting action items"
ON public.meeting_action_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leadership_meetings m
    WHERE m.id = meeting_action_items.meeting_id
      AND public.is_leadership(auth.uid())
      AND (m.unit_id IS NULL OR public.user_can_access_unit(auth.uid(), m.unit_id))
  )
);

DROP POLICY IF EXISTS "Admins can manage meeting action items" ON public.meeting_action_items;
CREATE POLICY "Admins can manage meeting action items"
ON public.meeting_action_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor'));

CREATE TRIGGER update_meeting_minutes_updated_at
BEFORE UPDATE ON public.meeting_minutes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_action_items_updated_at
BEFORE UPDATE ON public.meeting_action_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-recordings', 'meeting-recordings', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Leadership can upload meeting recordings" ON storage.objects;
CREATE POLICY "Leadership can upload meeting recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'meeting-recordings' AND public.is_leadership(auth.uid()));

DROP POLICY IF EXISTS "Leadership can view meeting recordings" ON storage.objects;
CREATE POLICY "Leadership can view meeting recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'meeting-recordings' AND public.is_leadership(auth.uid()));