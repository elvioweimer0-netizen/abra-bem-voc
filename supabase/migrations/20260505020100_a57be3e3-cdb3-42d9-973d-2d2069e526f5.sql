
-- 1) manager_to_supervisor_tasks
CREATE TABLE public.manager_to_supervisor_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  unit_id uuid,
  title text NOT NULL,
  description text,
  due_date date,
  status text NOT NULL DEFAULT 'aberto',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mts_to_user ON public.manager_to_supervisor_tasks(to_user_id, status);
CREATE INDEX idx_mts_from_user ON public.manager_to_supervisor_tasks(from_user_id);

CREATE OR REPLACE FUNCTION public.tg_validate_mts_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('aberto','feito','arquivado') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.status = 'feito' AND NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_mts_validate
BEFORE INSERT OR UPDATE ON public.manager_to_supervisor_tasks
FOR EACH ROW EXECUTE FUNCTION public.tg_validate_mts_status();

ALTER TABLE public.manager_to_supervisor_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mts_select"
ON public.manager_to_supervisor_tasks FOR SELECT
USING (
  to_user_id = auth.uid()
  OR from_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'master')
);

CREATE POLICY "mts_insert"
ON public.manager_to_supervisor_tasks FOR INSERT
WITH CHECK (
  from_user_id = auth.uid()
  AND (
    public.has_role(auth.uid(), 'gerente_loja')
    OR public.has_role(auth.uid(), 'gerente')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'master')
  )
);

CREATE POLICY "mts_update_recipient"
ON public.manager_to_supervisor_tasks FOR UPDATE
USING (to_user_id = auth.uid() OR from_user_id = auth.uid())
WITH CHECK (to_user_id = auth.uid() OR from_user_id = auth.uid());

CREATE POLICY "mts_delete_sender"
ON public.manager_to_supervisor_tasks FOR DELETE
USING (from_user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));


-- 2) encarregado_scores
CREATE TABLE public.encarregado_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encarregado_user_id uuid NOT NULL,
  unit_id uuid,
  year smallint NOT NULL,
  month smallint NOT NULL,
  score numeric(4,2) NOT NULL DEFAULT 0,
  components jsonb NOT NULL DEFAULT '{}'::jsonb,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (encarregado_user_id, year, month)
);
CREATE INDEX idx_enc_scores_user ON public.encarregado_scores(encarregado_user_id, year, month);

ALTER TABLE public.encarregado_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enc_scores_select"
ON public.encarregado_scores FOR SELECT
USING (
  encarregado_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'master')
  OR public.has_role(auth.uid(), 'supervisor')
  OR (
    (public.has_role(auth.uid(), 'gerente_loja') OR public.has_role(auth.uid(), 'gerente'))
    AND unit_id IS NOT NULL
    AND unit_id IN (SELECT p.unit_id FROM public.profiles p WHERE p.user_id = auth.uid())
  )
);


-- 3) master_pinned_items
CREATE TABLE public.master_pinned_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  link text,
  active boolean NOT NULL DEFAULT true,
  ordem smallint NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mpi_active ON public.master_pinned_items(active, ordem);

CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_mpi_updated_at
BEFORE UPDATE ON public.master_pinned_items
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

ALTER TABLE public.master_pinned_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mpi_select_all"
ON public.master_pinned_items FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "mpi_write_admin"
ON public.master_pinned_items FOR ALL
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));
