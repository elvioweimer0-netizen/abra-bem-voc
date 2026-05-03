
-- Tabela pdi_goals
CREATE TABLE public.pdi_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encarregado_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  gerente_user_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  unit_id uuid REFERENCES public.units(id),
  trimestre smallint NOT NULL CHECK (trimestre BETWEEN 1 AND 4),
  ano smallint NOT NULL CHECK (ano >= 2025),
  titulo text NOT NULL CHECK (length(titulo) BETWEEN 5 AND 100),
  descricao text NOT NULL,
  meta_valor numeric,
  meta_unidade text,
  valor_atual numeric,
  status text NOT NULL DEFAULT 'em_andamento'
    CHECK (status IN ('em_andamento','atingida','parcialmente_atingida','nao_atingida','cancelada')),
  prazo date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE INDEX idx_pdi_goals_enc_trim_ano ON public.pdi_goals(encarregado_user_id, trimestre, ano);
CREATE INDEX idx_pdi_goals_unit ON public.pdi_goals(unit_id);

ALTER TABLE public.pdi_goals ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER tg_pdi_goals_updated_at
  BEFORE UPDATE ON public.pdi_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela pdi_progress_updates
CREATE TABLE public.pdi_progress_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.pdi_goals(id) ON DELETE CASCADE,
  autor_user_id uuid NOT NULL REFERENCES public.profiles(user_id),
  valor_atual numeric,
  observacao text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pdi_updates_goal ON public.pdi_progress_updates(goal_id, created_at DESC);

ALTER TABLE public.pdi_progress_updates ENABLE ROW LEVEL SECURITY;

-- Helper: pode acessar a meta?
CREATE OR REPLACE FUNCTION public.can_view_pdi_goal(_uid uuid, _goal_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pdi_goals g
    WHERE g.id = _goal_id
      AND (
        g.encarregado_user_id = _uid
        OR g.gerente_user_id = _uid
        OR public.has_role(_uid, 'admin'::cargo_tipo)
        OR public.has_role(_uid, 'master'::cargo_tipo)
        OR public.has_role(_uid, 'supervisor'::cargo_tipo)
        OR (public.has_role(_uid, 'gerente_loja'::cargo_tipo) AND public.user_can_access_unit(_uid, g.unit_id))
      )
  )
$$;

-- RLS pdi_goals
CREATE POLICY "pdi_goals_insert_leaders" ON public.pdi_goals
  FOR INSERT WITH CHECK (
    gerente_user_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'gerente_loja'::cargo_tipo)
      OR public.has_role(auth.uid(), 'master'::cargo_tipo)
      OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
      OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
    )
    AND public.user_can_access_unit(auth.uid(), unit_id)
  );

CREATE POLICY "pdi_goals_select" ON public.pdi_goals
  FOR SELECT USING (
    encarregado_user_id = auth.uid()
    OR gerente_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
    OR (public.has_role(auth.uid(), 'gerente_loja'::cargo_tipo) AND public.user_can_access_unit(auth.uid(), unit_id))
  );

CREATE POLICY "pdi_goals_update_leaders" ON public.pdi_goals
  FOR UPDATE USING (
    gerente_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'master'::cargo_tipo)
    OR public.has_role(auth.uid(), 'supervisor'::cargo_tipo)
    OR (public.has_role(auth.uid(), 'gerente_loja'::cargo_tipo) AND public.user_can_access_unit(auth.uid(), unit_id))
  );

CREATE POLICY "pdi_goals_delete_admin" ON public.pdi_goals
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin'::cargo_tipo)
    OR public.has_role(auth.uid(), 'master'::cargo_tipo)
  );

-- RLS pdi_progress_updates
CREATE POLICY "pdi_updates_insert" ON public.pdi_progress_updates
  FOR INSERT WITH CHECK (
    autor_user_id = auth.uid()
    AND public.can_view_pdi_goal(auth.uid(), goal_id)
  );

CREATE POLICY "pdi_updates_select" ON public.pdi_progress_updates
  FOR SELECT USING (
    public.can_view_pdi_goal(auth.uid(), goal_id)
  );

-- Trigger: atualizar valor_atual da meta ao inserir progresso
CREATE OR REPLACE FUNCTION public.tg_pdi_apply_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.valor_atual IS NOT NULL THEN
    UPDATE public.pdi_goals
      SET valor_atual = NEW.valor_atual, updated_at = now()
      WHERE id = NEW.goal_id;
  ELSE
    UPDATE public.pdi_goals SET updated_at = now() WHERE id = NEW.goal_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_pdi_apply_progress
  AFTER INSERT ON public.pdi_progress_updates
  FOR EACH ROW EXECUTE FUNCTION public.tg_pdi_apply_progress();

-- Trigger: notificar encarregado ao criar nova meta
CREATE OR REPLACE FUNCTION public.tg_pdi_notify_new_goal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.encarregado_user_id <> COALESCE(NEW.gerente_user_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    INSERT INTO public.notification_events (type, recipient_user_id, unit_id, title, body, payload)
    VALUES ('pdi_new_goal', NEW.encarregado_user_id, NEW.unit_id,
            'Nova meta de PDI',
            'Você recebeu uma nova meta: ' || NEW.titulo,
            jsonb_build_object('goal_id', NEW.id, 'trimestre', NEW.trimestre, 'ano', NEW.ano));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_pdi_notify_new_goal
  AFTER INSERT ON public.pdi_goals
  FOR EACH ROW EXECUTE FUNCTION public.tg_pdi_notify_new_goal();
