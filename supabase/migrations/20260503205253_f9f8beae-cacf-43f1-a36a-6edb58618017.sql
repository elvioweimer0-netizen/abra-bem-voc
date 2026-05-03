-- Curió de Ouro Peer-to-Peer

ALTER TABLE public.praises
  ADD COLUMN IF NOT EXISTS praise_type text NOT NULL DEFAULT 'liderado'
  CHECK (praise_type IN ('liderado','peer','equipe_externa'));

CREATE INDEX IF NOT EXISTS idx_praises_praise_type ON public.praises(praise_type);

-- Helper: pode autor criar praise pra destinatario com tipo X?
CREATE OR REPLACE FUNCTION public.can_create_praise(_autor uuid, _destinatario_member uuid, _type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _autor_cargo cargo_tipo;
  _autor_unit uuid;
  _autor_perm uuid[];
  _dest_user uuid;
  _dest_unit uuid;
  _dest_cargo cargo_tipo;
BEGIN
  IF _autor IS NULL OR _destinatario_member IS NULL THEN
    RETURN false;
  END IF;

  SELECT p.cargo, p.unit_id, p.permission_units
    INTO _autor_cargo, _autor_unit, _autor_perm
    FROM public.profiles p WHERE p.user_id = _autor;
  IF _autor_cargo IS NULL THEN RETURN false; END IF;

  SELECT tm.user_id, tm.unit_id, p.cargo
    INTO _dest_user, _dest_unit, _dest_cargo
    FROM public.team_members tm
    LEFT JOIN public.profiles p ON p.user_id = tm.user_id
   WHERE tm.id = _destinatario_member;
  IF _dest_unit IS NULL THEN RETURN false; END IF;

  -- Não pode elogiar a si mesmo (quando destinatario tem profile)
  IF _dest_user IS NOT NULL AND _dest_user = _autor THEN
    RETURN false;
  END IF;

  IF _type = 'liderado' THEN
    RETURN public.user_can_access_unit(_autor, _dest_unit);

  ELSIF _type = 'peer' THEN
    -- mesmo cargo, mesma unit, ambos têm profile
    RETURN _dest_user IS NOT NULL
       AND _dest_cargo IS NOT NULL
       AND _dest_cargo = _autor_cargo
       AND _dest_unit = _autor_unit;

  ELSIF _type = 'equipe_externa' THEN
    -- destinatario está em unit acessível via permission_units do autor (ou admin/master/supervisor)
    RETURN public.has_role(_autor, 'admin'::cargo_tipo)
        OR public.has_role(_autor, 'master'::cargo_tipo)
        OR public.has_role(_autor, 'supervisor'::cargo_tipo)
        OR (_dest_unit = ANY(_autor_perm));
  END IF;

  RETURN false;
END;
$$;

-- Atualizar policy de INSERT
DROP POLICY IF EXISTS "Leadership creates praises" ON public.praises;

CREATE POLICY "Authors create praises by type"
ON public.praises
FOR INSERT
TO authenticated
WITH CHECK (
  autor_id = auth.uid()
  AND public.can_create_praise(auth.uid(), destinatario_id, praise_type)
);

-- Conquista Diplomata
INSERT INTO public.achievements (code, name, description, icon, category, criteria_type, criteria_target, criteria_metric, ordem, active)
VALUES (
  'diplomata_5',
  'Diplomata',
  'Recebeu 5 reconhecimentos de pares ou de outras equipes',
  '🤝',
  'cultura',
  'count',
  5,
  'received_peer_external_kudos_count',
  17,
  true
)
ON CONFLICT (code) DO NOTHING;
