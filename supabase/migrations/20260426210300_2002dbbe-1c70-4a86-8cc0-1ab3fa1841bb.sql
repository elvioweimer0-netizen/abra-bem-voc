ALTER TABLE public.leadership_occurrences
ADD COLUMN IF NOT EXISTS titulo TEXT,
ADD COLUMN IF NOT EXISTS motivos JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS setor TEXT,
ADD COLUMN IF NOT EXISTS urgencia public.occurrence_severity NOT NULL DEFAULT 'media',
ADD COLUMN IF NOT EXISTS fotos TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custo_estimado NUMERIC,
ADD COLUMN IF NOT EXISTS prazo_desejado DATE,
ADD COLUMN IF NOT EXISTS observacao TEXT;

UPDATE public.leadership_occurrences
SET titulo = COALESCE(titulo, CASE WHEN length(descricao) > 72 THEN left(descricao, 69) || '...' ELSE descricao END),
    urgencia = COALESCE(urgencia, gravidade),
    motivos = CASE WHEN motivos = '[]'::jsonb THEN jsonb_build_array(tipo::text) ELSE motivos END,
    fotos = CASE WHEN foto_url IS NOT NULL AND array_length(fotos, 1) IS NULL THEN ARRAY[foto_url] ELSE fotos END
WHERE titulo IS NULL OR motivos = '[]'::jsonb OR (foto_url IS NOT NULL AND array_length(fotos, 1) IS NULL);

ALTER TABLE public.leadership_occurrences
ALTER COLUMN titulo SET NOT NULL;

CREATE OR REPLACE FUNCTION public.profile_matches_occurrence_reason(_user_id uuid, _motivos jsonb, _unit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    LEFT JOIN public.units u ON u.id = p.unit_id
    WHERE p.user_id = _user_id
      AND (
        (jsonb_exists(_motivos, 'operacional') AND p.unit_id = _unit_id AND (public.has_role(_user_id, 'gerente') OR public.has_role(_user_id, 'gerente_loja')))
        OR (jsonb_exists(_motivos, 'rh') AND (lower(p.nome) LIKE '%gleisiane%' OR lower(coalesce(p.cargo_titulo, '')) LIKE '%rh%' OR lower(coalesce(p.descricao, '')) LIKE '%rh%'))
        OR (jsonb_exists(_motivos, 'dp') AND (lower(p.nome) LIKE '%ygor%' OR lower(coalesce(p.cargo_titulo, '')) LIKE '%dp%' OR lower(coalesce(p.cargo_titulo, '')) LIKE '%departamento pessoal%' OR lower(coalesce(p.descricao, '')) LIKE '%departamento pessoal%'))
        OR (jsonb_exists(_motivos, 'supervisao') AND (lower(p.nome) LIKE '%roberto%' OR public.has_role(_user_id, 'supervisor')))
        OR (jsonb_exists(_motivos, 'diretor') AND (lower(p.nome) LIKE '%elvio%' OR lower(p.nome) LIKE '%guga%' OR public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'master')))
        OR (jsonb_exists(_motivos, 'manutencao') AND (lower(p.nome) LIKE '%hilton%' OR lower(coalesce(p.cargo_titulo, '')) LIKE '%manuten%' OR lower(coalesce(p.descricao, '')) LIKE '%manuten%'))
        OR (jsonb_exists(_motivos, 'marketing') AND (lower(coalesce(p.cargo_titulo, '')) LIKE '%marketing%' OR lower(coalesce(p.descricao, '')) LIKE '%marketing%' OR u.type = 'central'))
        OR (jsonb_exists(_motivos, 'comercial') AND (lower(coalesce(p.cargo_titulo, '')) LIKE '%comercial%' OR lower(coalesce(p.descricao, '')) LIKE '%comercial%'))
        OR (jsonb_exists(_motivos, 'financeiro') AND (lower(p.nome) LIKE '%regiane%' OR lower(coalesce(p.cargo_titulo, '')) LIKE '%financeiro%' OR lower(coalesce(p.descricao, '')) LIKE '%financeiro%'))
        OR (jsonb_exists(_motivos, 'ti') AND (lower(p.nome) LIKE '%kildery%' OR lower(coalesce(p.cargo_titulo, '')) LIKE '%ti%' OR lower(coalesce(p.descricao, '')) LIKE '%ti%'))
        OR (jsonb_exists(_motivos, 'administrativo') AND (lower(coalesce(p.cargo_titulo, '')) LIKE '%administrativo%' OR lower(coalesce(p.descricao, '')) LIKE '%administrativo%'))
      )
  )
$$;

DROP POLICY IF EXISTS "Leadership can view occurrences" ON public.leadership_occurrences;
DROP POLICY IF EXISTS "Leadership can create occurrences" ON public.leadership_occurrences;
DROP POLICY IF EXISTS "Leadership can update occurrences" ON public.leadership_occurrences;

CREATE POLICY "Scoped users can view occurrences"
ON public.leadership_occurrences
FOR SELECT
TO authenticated
USING (
  reportado_por = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'master')
  OR public.has_role(auth.uid(), 'supervisor')
  OR (public.is_leadership(auth.uid()) AND public.user_can_access_unit(auth.uid(), unit_id))
  OR public.profile_matches_occurrence_reason(auth.uid(), motivos, unit_id)
);

CREATE POLICY "Leadership can create occurrences"
ON public.leadership_occurrences
FOR INSERT
TO authenticated
WITH CHECK (
  reportado_por = auth.uid()
  AND public.is_leadership(auth.uid())
  AND public.user_can_access_unit(auth.uid(), unit_id)
);

CREATE POLICY "Scoped leaders can update occurrences"
ON public.leadership_occurrences
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'master')
  OR public.has_role(auth.uid(), 'supervisor')
  OR (public.is_leadership(auth.uid()) AND public.user_can_access_unit(auth.uid(), unit_id))
  OR public.profile_matches_occurrence_reason(auth.uid(), motivos, unit_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'master')
  OR public.has_role(auth.uid(), 'supervisor')
  OR (public.is_leadership(auth.uid()) AND public.user_can_access_unit(auth.uid(), unit_id))
  OR public.profile_matches_occurrence_reason(auth.uid(), motivos, unit_id)
);

CREATE OR REPLACE FUNCTION public.enqueue_occurrence_reason_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reason text;
  recipient record;
  notification_body text;
BEGIN
  notification_body := '🚨 Nova ocorrência ' || NEW.urgencia::text || ': ' || NEW.titulo || '. Toque pra ver.';

  FOR reason IN SELECT jsonb_array_elements_text(NEW.motivos)
  LOOP
    FOR recipient IN
      SELECT DISTINCT p.user_id
      FROM public.profiles p
      LEFT JOIN public.units u ON u.id = p.unit_id
      WHERE p.ativo = true
        AND p.user_id IS NOT NULL
        AND (
          (reason = 'operacional' AND p.unit_id = NEW.unit_id AND (public.has_role(p.user_id, 'gerente') OR public.has_role(p.user_id, 'gerente_loja')))
          OR (reason = 'rh' AND lower(p.nome) LIKE '%gleisiane%')
          OR (reason = 'dp' AND lower(p.nome) LIKE '%ygor%')
          OR (reason = 'supervisao' AND (lower(p.nome) LIKE '%roberto%' OR public.has_role(p.user_id, 'supervisor')))
          OR (reason = 'diretor' AND (lower(p.nome) LIKE '%elvio%' OR lower(p.nome) LIKE '%guga%' OR public.has_role(p.user_id, 'admin') OR public.has_role(p.user_id, 'master')))
          OR (reason = 'manutencao' AND (lower(p.nome) LIKE '%hilton%' OR lower(coalesce(p.cargo_titulo, '')) LIKE '%manuten%' OR lower(coalesce(p.descricao, '')) LIKE '%manuten%'))
          OR (reason = 'marketing' AND (lower(coalesce(p.cargo_titulo, '')) LIKE '%marketing%' OR lower(coalesce(p.descricao, '')) LIKE '%marketing%' OR u.type = 'central'))
          OR (reason = 'comercial' AND (lower(coalesce(p.cargo_titulo, '')) LIKE '%comercial%' OR lower(coalesce(p.descricao, '')) LIKE '%comercial%'))
          OR (reason = 'financeiro' AND (lower(p.nome) LIKE '%regiane%' OR lower(coalesce(p.cargo_titulo, '')) LIKE '%financeiro%' OR lower(coalesce(p.descricao, '')) LIKE '%financeiro%'))
          OR (reason = 'ti' AND (lower(p.nome) LIKE '%kildery%' OR lower(coalesce(p.cargo_titulo, '')) LIKE '%ti%' OR lower(coalesce(p.descricao, '')) LIKE '%ti%'))
          OR (reason = 'administrativo' AND (lower(coalesce(p.cargo_titulo, '')) LIKE '%administrativo%' OR lower(coalesce(p.descricao, '')) LIKE '%administrativo%'))
        )
    LOOP
      INSERT INTO public.notification_events (type, recipient_user_id, unit_id, title, body, payload)
      VALUES ('high_occurrence', recipient.user_id, NEW.unit_id, 'Nova ocorrência', notification_body, jsonb_build_object('occurrence_id', NEW.id, 'reason', reason));
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enqueue_occurrence_reason_notifications ON public.leadership_occurrences;
CREATE TRIGGER enqueue_occurrence_reason_notifications
AFTER INSERT ON public.leadership_occurrences
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_occurrence_reason_notifications();

CREATE INDEX IF NOT EXISTS idx_leadership_occurrences_motivos ON public.leadership_occurrences USING gin (motivos);
CREATE INDEX IF NOT EXISTS idx_leadership_occurrences_urgencia ON public.leadership_occurrences (urgencia);
CREATE INDEX IF NOT EXISTS idx_leadership_occurrences_criado_em ON public.leadership_occurrences (criado_em DESC);