
CREATE TABLE IF NOT EXISTS public.master_pending_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  ref_id uuid,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decided_at timestamptz,
  decided_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_pending_decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mpd select" ON public.master_pending_decisions;
CREATE POLICY "mpd select" ON public.master_pending_decisions FOR SELECT USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));
DROP POLICY IF EXISTS "mpd update" ON public.master_pending_decisions;
CREATE POLICY "mpd update" ON public.master_pending_decisions FOR UPDATE USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));
DROP TRIGGER IF EXISTS tg_mpd_updated ON public.master_pending_decisions;
CREATE TRIGGER tg_mpd_updated BEFORE UPDATE ON public.master_pending_decisions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.master_manager_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_user_id uuid NOT NULL,
  master_user_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_manager_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mmn select" ON public.master_manager_notes;
CREATE POLICY "mmn select" ON public.master_manager_notes FOR SELECT USING (master_user_id = auth.uid());
DROP POLICY IF EXISTS "mmn insert" ON public.master_manager_notes;
CREATE POLICY "mmn insert" ON public.master_manager_notes FOR INSERT WITH CHECK (master_user_id = auth.uid());
DROP POLICY IF EXISTS "mmn update" ON public.master_manager_notes;
CREATE POLICY "mmn update" ON public.master_manager_notes FOR UPDATE USING (master_user_id = auth.uid());
DROP POLICY IF EXISTS "mmn delete" ON public.master_manager_notes;
CREATE POLICY "mmn delete" ON public.master_manager_notes FOR DELETE USING (master_user_id = auth.uid());
DROP TRIGGER IF EXISTS tg_mmn_updated ON public.master_manager_notes;
CREATE TRIGGER tg_mmn_updated BEFORE UPDATE ON public.master_manager_notes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.master_spy_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_user_id uuid NOT NULL,
  target_user_id uuid,
  target_unit_id uuid,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  action_taken text
);
ALTER TABLE public.master_spy_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "msl insert" ON public.master_spy_log;
CREATE POLICY "msl insert" ON public.master_spy_log FOR INSERT WITH CHECK (master_user_id = auth.uid() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'supervisor')));
DROP POLICY IF EXISTS "msl select" ON public.master_spy_log;
CREATE POLICY "msl select" ON public.master_spy_log FOR SELECT USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));

CREATE TABLE IF NOT EXISTS public.master_one_on_ones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gerente_user_id uuid NOT NULL,
  master_user_id uuid NOT NULL,
  scheduled_for timestamptz NOT NULL,
  completed_at timestamptz,
  notes text,
  action_items jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_one_on_ones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "m1on1 select" ON public.master_one_on_ones;
CREATE POLICY "m1on1 select" ON public.master_one_on_ones FOR SELECT USING (master_user_id = auth.uid() OR gerente_user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));
DROP POLICY IF EXISTS "m1on1 insert" ON public.master_one_on_ones;
CREATE POLICY "m1on1 insert" ON public.master_one_on_ones FOR INSERT WITH CHECK (master_user_id = auth.uid() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'supervisor')));
DROP POLICY IF EXISTS "m1on1 update" ON public.master_one_on_ones;
CREATE POLICY "m1on1 update" ON public.master_one_on_ones FOR UPDATE USING (master_user_id = auth.uid() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'supervisor')));
DROP TRIGGER IF EXISTS tg_m1on1_updated ON public.master_one_on_ones;
CREATE TRIGGER tg_m1on1_updated BEFORE UPDATE ON public.master_one_on_ones FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.master_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL,
  master_user_id uuid NOT NULL,
  scheduled_for date NOT NULL,
  completed_at timestamptz,
  notes text,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mv select" ON public.master_visits;
CREATE POLICY "mv select" ON public.master_visits FOR SELECT USING (master_user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'supervisor') OR public.is_unit_manager(auth.uid(), unit_id));
DROP POLICY IF EXISTS "mv insert" ON public.master_visits;
CREATE POLICY "mv insert" ON public.master_visits FOR INSERT WITH CHECK (master_user_id = auth.uid() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'supervisor')));
DROP POLICY IF EXISTS "mv update" ON public.master_visits;
CREATE POLICY "mv update" ON public.master_visits FOR UPDATE USING (master_user_id = auth.uid() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'supervisor')));
DROP TRIGGER IF EXISTS tg_mv_updated ON public.master_visits;
CREATE TRIGGER tg_mv_updated BEFORE UPDATE ON public.master_visits FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.master_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL UNIQUE,
  kpis jsonb NOT NULL DEFAULT '{}'::jsonb,
  alerts jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_movers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ms select" ON public.master_snapshots;
CREATE POLICY "ms select" ON public.master_snapshots FOR SELECT USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'supervisor'));

CREATE OR REPLACE FUNCTION public.is_master_or_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(_uid,'admin') OR public.has_role(_uid,'master') $$;
