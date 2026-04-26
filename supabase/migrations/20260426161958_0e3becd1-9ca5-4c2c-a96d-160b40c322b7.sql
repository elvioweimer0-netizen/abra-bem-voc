CREATE TABLE public.ai_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.leadership_meetings(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  responsavel_sugerido TEXT,
  prazo_sugerido DATE,
  beneficio_esperado TEXT NOT NULL DEFAULT '',
  audiencia JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pendente',
  aprovada_por UUID,
  aprovada_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ai_suggestions_meeting_id ON public.ai_suggestions(meeting_id);
CREATE INDEX idx_ai_suggestions_status ON public.ai_suggestions(status);

CREATE TRIGGER update_ai_suggestions_updated_at
BEFORE UPDATE ON public.ai_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Leadership can view AI suggestions"
ON public.ai_suggestions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.leadership_meetings m
    WHERE m.id = ai_suggestions.meeting_id
      AND public.is_leadership(auth.uid())
      AND (m.unit_id IS NULL OR public.user_can_access_unit(auth.uid(), m.unit_id))
  )
);

CREATE POLICY "Admins and supervisors can create AI suggestions"
ON public.ai_suggestions
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'master')
  OR public.has_role(auth.uid(), 'supervisor')
);

CREATE POLICY "Admins and supervisors can update AI suggestions"
ON public.ai_suggestions
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