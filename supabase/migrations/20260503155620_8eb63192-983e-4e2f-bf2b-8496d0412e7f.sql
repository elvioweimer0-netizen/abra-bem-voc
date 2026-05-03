-- TV de Refeitório: displays públicos por unidade

CREATE TABLE public.tv_displays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  display_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  slide_duration_seconds smallint NOT NULL DEFAULT 12,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tv_displays_unit ON public.tv_displays(unit_id);
CREATE INDEX idx_tv_displays_token ON public.tv_displays(display_token) WHERE active = true;

CREATE TABLE public.tv_display_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id uuid NOT NULL REFERENCES public.tv_displays(id) ON DELETE CASCADE,
  card_type text NOT NULL,
  ordem smallint NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (display_id, card_type)
);

CREATE INDEX idx_tv_display_cards_display ON public.tv_display_cards(display_id, ordem);

ALTER TABLE public.tv_displays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_display_cards ENABLE ROW LEVEL SECURITY;

-- SELECT: master/admin/supervisor
CREATE POLICY "tv_displays_select_admin"
  ON public.tv_displays FOR SELECT
  USING (
    public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
  );

CREATE POLICY "tv_displays_write_admin"
  ON public.tv_displays FOR ALL
  USING (
    public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  );

CREATE POLICY "tv_display_cards_select_admin"
  ON public.tv_display_cards FOR SELECT
  USING (
    public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
  );

CREATE POLICY "tv_display_cards_write_admin"
  ON public.tv_display_cards FOR ALL
  USING (
    public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
  );

CREATE TRIGGER trg_tv_displays_updated
  BEFORE UPDATE ON public.tv_displays
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_tv_display_cards_updated
  BEFORE UPDATE ON public.tv_display_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default cards
CREATE OR REPLACE FUNCTION public.seed_default_tv_cards(_display_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  defaults text[] := ARRAY[
    'aniversariantes',
    'curio_ouro',
    'stories_unidade',
    'top_pendencias',
    'compromissos_semana',
    'historias_curio',
    'avisos_importantes',
    'conquistas_equipe',
    'pilula_cultura'
  ];
  i int;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'master'::cargo_tipo) OR public.has_role(auth.uid(), 'admin'::cargo_tipo)) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  FOR i IN 1 .. array_length(defaults, 1) LOOP
    INSERT INTO public.tv_display_cards (display_id, card_type, ordem, enabled)
    VALUES (_display_id, defaults[i], i, true)
    ON CONFLICT (display_id, card_type) DO NOTHING;
  END LOOP;
END;
$$;

-- Token regeneration helper
CREATE OR REPLACE FUNCTION public.regenerate_tv_display_token(_display_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_token text;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'master'::cargo_tipo) OR public.has_role(auth.uid(), 'admin'::cargo_tipo)) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  new_token := encode(gen_random_bytes(24), 'hex');
  UPDATE public.tv_displays SET display_token = new_token, updated_at = now() WHERE id = _display_id;
  RETURN new_token;
END;
$$;