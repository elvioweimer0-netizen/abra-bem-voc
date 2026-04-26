CREATE TABLE IF NOT EXISTS public.meeting_pauta_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggested_by UUID NOT NULL,
  suggested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  target_meeting_type meeting_type NOT NULL,
  unit_id UUID REFERENCES public.units(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'pendente',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  motivo_rejeicao TEXT,
  included_in_meeting_id UUID REFERENCES public.leadership_meetings(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_pauta_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers create own pauta suggestions"
ON public.meeting_pauta_suggestions
FOR INSERT
TO authenticated
WITH CHECK (
  suggested_by = auth.uid()
  AND (
    public.has_role(auth.uid(), 'gerente')
    OR public.has_role(auth.uid(), 'gerente_loja')
    OR public.has_role(auth.uid(), 'gerente_adm')
  )
  AND (unit_id IS NULL OR public.user_can_access_unit(auth.uid(), unit_id))
);

CREATE POLICY "Leadership views permitted pauta suggestions"
ON public.meeting_pauta_suggestions
FOR SELECT
TO authenticated
USING (
  suggested_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'master')
  OR public.has_role(auth.uid(), 'supervisor')
  OR (unit_id IS NOT NULL AND public.user_can_access_unit(auth.uid(), unit_id) AND public.is_leadership(auth.uid()))
);

CREATE POLICY "Admins and supervisors review pauta suggestions"
ON public.meeting_pauta_suggestions
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'master')
  OR public.has_role(auth.uid(), 'supervisor')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'master')
  OR public.has_role(auth.uid(), 'supervisor')
);

CREATE INDEX IF NOT EXISTS idx_meeting_pauta_suggestions_status ON public.meeting_pauta_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_meeting_pauta_suggestions_type ON public.meeting_pauta_suggestions(target_meeting_type);
CREATE INDEX IF NOT EXISTS idx_meeting_pauta_suggestions_unit ON public.meeting_pauta_suggestions(unit_id);

DROP TRIGGER IF EXISTS update_meeting_pauta_suggestions_updated_at ON public.meeting_pauta_suggestions;
CREATE TRIGGER update_meeting_pauta_suggestions_updated_at
BEFORE UPDATE ON public.meeting_pauta_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();