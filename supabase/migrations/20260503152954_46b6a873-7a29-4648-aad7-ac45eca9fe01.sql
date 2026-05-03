
ALTER TABLE public.training_modules
  ADD COLUMN IF NOT EXISTS onboarding_track boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_training_modules_onboarding
  ON public.training_modules (onboarding_track, ordem)
  WHERE onboarding_track = true;

CREATE TABLE public.onboarding_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  expected_completion_date date NOT NULL DEFAULT ((now()::date) + 30),
  completed_at timestamptz NULL,
  total_modules int NOT NULL DEFAULT 0,
  completed_modules int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento','concluido','atrasado')),
  last_activity_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onboarding_journeys_status ON public.onboarding_journeys(status, expected_completion_date);

CREATE TRIGGER trg_onboarding_journeys_updated
BEFORE UPDATE ON public.onboarding_journeys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.tg_onboarding_set_expected()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.expected_completion_date := (NEW.started_at::date + 30);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_onboarding_set_expected
BEFORE INSERT OR UPDATE OF started_at ON public.onboarding_journeys
FOR EACH ROW EXECUTE FUNCTION public.tg_onboarding_set_expected();

ALTER TABLE public.onboarding_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journey_select_own"
ON public.onboarding_journeys FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "journey_select_unit_leader"
ON public.onboarding_journeys FOR SELECT TO authenticated
USING (
  public.is_leadership(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = onboarding_journeys.user_id
      AND p.unit_id IS NOT NULL
      AND public.user_can_access_unit(auth.uid(), p.unit_id)
  )
);

CREATE POLICY "journey_select_rh_admin"
ON public.onboarding_journeys FOR SELECT TO authenticated
USING (public.is_rh_or_admin(auth.uid()));

INSERT INTO public.achievements (code, name, description, icon, category, criteria_type, criteria_target, criteria_metric, ordem)
VALUES ('cidadao_curio', 'Cidadão Curió', 'Concluiu o onboarding cultural completo', '🎓', 'cultura', 'one_time', 1, 'onboarding_completed', 50)
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.tg_create_onboarding_journey()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _total int;
BEGIN
  IF NEW.cargo NOT IN ('colaborador'::cargo_tipo, 'lider_setor'::cargo_tipo) THEN RETURN NEW; END IF;
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO _total FROM public.training_modules WHERE active = true AND onboarding_track = true;
  INSERT INTO public.onboarding_journeys (user_id, total_modules)
  VALUES (NEW.user_id, COALESCE(_total, 0))
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.notification_events (type, title, body, recipient_user_id, payload)
  VALUES ('onboarding_welcome', 'Bem-vindo ao Curió! 🎉', 'Comece seu onboarding cultural agora.', NEW.user_id,
          jsonb_build_object('total_modules', _total));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_onboarding_journey
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_create_onboarding_journey();

CREATE OR REPLACE FUNCTION public.tg_update_journey_on_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _is_onboarding boolean;
  _journey_id uuid;
  _new_count int;
  _total int;
  _achievement_id uuid;
  _user_unit uuid;
  _user_name text;
  manager_rec record;
BEGIN
  SELECT onboarding_track INTO _is_onboarding FROM public.training_modules WHERE id = NEW.module_id;
  IF NOT COALESCE(_is_onboarding, false) THEN RETURN NEW; END IF;

  SELECT id, total_modules INTO _journey_id, _total FROM public.onboarding_journeys WHERE user_id = NEW.user_id;
  IF _journey_id IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(DISTINCT tc.module_id) INTO _new_count
  FROM public.training_completions tc
  JOIN public.training_modules tm ON tm.id = tc.module_id
  WHERE tc.user_id = NEW.user_id AND tm.onboarding_track = true;

  UPDATE public.onboarding_journeys
  SET completed_modules = _new_count,
      last_activity_at = now(),
      status = CASE WHEN _new_count >= _total AND _total > 0 THEN 'concluido' ELSE status END,
      completed_at = CASE WHEN _new_count >= _total AND _total > 0 THEN now() ELSE completed_at END
  WHERE id = _journey_id;

  IF _new_count >= _total AND _total > 0 THEN
    SELECT id INTO _achievement_id FROM public.achievements WHERE code = 'cidadao_curio';
    IF _achievement_id IS NOT NULL THEN
      INSERT INTO public.user_achievements (user_id, achievement_id, current_progress, completed, unlocked_at)
      VALUES (NEW.user_id, _achievement_id, 1, true, now())
      ON CONFLICT (user_id, achievement_id) DO UPDATE
        SET completed = true, unlocked_at = COALESCE(user_achievements.unlocked_at, now()), current_progress = 1;
    END IF;

    INSERT INTO public.notification_events (type, title, body, recipient_user_id, payload)
    VALUES ('onboarding_completed', 'Você é Cidadão Curió! 🎓', 'Concluiu todo o onboarding cultural. Parabéns!',
            NEW.user_id, jsonb_build_object('journey_id', _journey_id));

    SELECT unit_id, nome INTO _user_unit, _user_name FROM public.profiles WHERE user_id = NEW.user_id;
    IF _user_unit IS NOT NULL THEN
      FOR manager_rec IN
        SELECT user_id FROM public.profiles
        WHERE unit_id = _user_unit AND user_id IS NOT NULL AND ativo = true
          AND public.is_unit_manager(user_id, _user_unit)
      LOOP
        INSERT INTO public.notification_events (type, title, body, recipient_user_id, unit_id, payload)
        VALUES ('onboarding_completed_team', 'Onboarding concluído',
                COALESCE(_user_name,'Colaborador') || ' concluiu o onboarding!',
                manager_rec.user_id, _user_unit,
                jsonb_build_object('user_id', NEW.user_id, 'journey_id', _journey_id));
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_journey_on_completion
AFTER INSERT ON public.training_completions
FOR EACH ROW EXECUTE FUNCTION public.tg_update_journey_on_completion();

CREATE OR REPLACE FUNCTION public.send_onboarding_incentive(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_rh_or_admin(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  INSERT INTO public.notification_events (type, title, body, recipient_user_id, payload)
  VALUES ('onboarding_incentive', 'Continue seu onboarding 💪',
          'Faltam poucas cápsulas pra você se tornar Cidadão Curió.',
          _user_id, jsonb_build_object('sender', auth.uid()));
END;
$$;

CREATE OR REPLACE FUNCTION public.run_onboarding_status_cron()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rec record;
BEGIN
  UPDATE public.onboarding_journeys SET status = 'atrasado'
  WHERE status = 'em_andamento' AND expected_completion_date < CURRENT_DATE;

  FOR rec IN
    SELECT j.user_id, j.id AS journey_id, p.nome, p.unit_id
    FROM public.onboarding_journeys j
    JOIN public.profiles p ON p.user_id = j.user_id
    WHERE j.status = 'atrasado' AND j.expected_completion_date = (CURRENT_DATE - 1)
  LOOP
    IF rec.unit_id IS NOT NULL THEN
      INSERT INTO public.notification_events (type, title, body, recipient_user_id, unit_id, payload)
      SELECT 'onboarding_late', 'Onboarding atrasado',
             COALESCE(rec.nome,'Colaborador') || ' passou do prazo de 30 dias.',
             m.user_id, rec.unit_id,
             jsonb_build_object('user_id', rec.user_id, 'journey_id', rec.journey_id)
      FROM public.profiles m
      WHERE m.unit_id = rec.unit_id AND m.user_id IS NOT NULL AND m.ativo = true
        AND public.is_unit_manager(m.user_id, rec.unit_id);
    END IF;
  END LOOP;

  INSERT INTO public.notification_events (type, title, body, recipient_user_id, payload)
  SELECT 'onboarding_weekly_reminder', 'Continue seu onboarding 🚀',
         'Faltam cápsulas pra você concluir.', j.user_id,
         jsonb_build_object('journey_id', j.id, 'completed', j.completed_modules, 'total', j.total_modules)
  FROM public.onboarding_journeys j
  WHERE j.status IN ('em_andamento','atrasado')
    AND (j.last_activity_at IS NULL OR j.last_activity_at < now() - interval '7 days')
    AND NOT EXISTS (
      SELECT 1 FROM public.notification_events n
      WHERE n.recipient_user_id = j.user_id AND n.type = 'onboarding_weekly_reminder'
        AND n.created_at > now() - interval '7 days'
    );
END;
$$;
