DO $$ BEGIN
  CREATE TYPE public.team_sector AS ENUM ('acougue','padaria','hortifruti','mercearia','frente_caixa','deposito','geral');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.team_member_role AS ENUM ('gerente','encarregado','colaborador');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.team_member_status AS ENUM ('ativo','ferias','afastado','desligado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.schedule_status AS ENUM ('rascunho','publicada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.swap_request_status AS ENUM ('pendente','aprovada','rejeitada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.praise_category AS ENUM ('atendimento','equipe','iniciativa','melhoria','outro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM ('presente','falta','atraso');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  unit_id uuid NOT NULL REFERENCES public.units(id),
  sector public.team_sector NOT NULL DEFAULT 'geral',
  role public.team_member_role NOT NULL DEFAULT 'colaborador',
  cargo text NOT NULL DEFAULT 'Colaborador',
  foto_url text,
  telefone text,
  data_admissao date,
  status public.team_member_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.work_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id),
  created_by uuid NOT NULL,
  status public.schedule_status NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_start, unit_id)
);

CREATE TABLE IF NOT EXISTS public.shift_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.work_schedules(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  shift_start time NOT NULL,
  shift_end time NOT NULL,
  sector public.team_sector NOT NULL DEFAULT 'geral',
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shift_swap_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  original_assignment_id uuid NOT NULL REFERENCES public.shift_assignments(id) ON DELETE CASCADE,
  target_member_id uuid REFERENCES public.team_members(id),
  target_assignment_id uuid REFERENCES public.shift_assignments(id),
  motivo text NOT NULL,
  status public.swap_request_status NOT NULL DEFAULT 'pendente',
  aprovado_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now(),
  resolvido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.encarregado_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encarregado_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  gerente_id uuid NOT NULL,
  mes text NOT NULL CHECK (mes ~ '^\d{4}-\d{2}$'),
  nota_pontualidade integer NOT NULL CHECK (nota_pontualidade BETWEEN 1 AND 5),
  nota_atendimento integer NOT NULL CHECK (nota_atendimento BETWEEN 1 AND 5),
  nota_postura integer NOT NULL CHECK (nota_postura BETWEEN 1 AND 5),
  nota_atitude integer NOT NULL CHECK (nota_atitude BETWEEN 1 AND 5),
  nota_geral numeric(3,2) NOT NULL DEFAULT 0,
  observacoes text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (encarregado_id, mes)
);

CREATE TABLE IF NOT EXISTS public.praises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id uuid NOT NULL,
  destinatario_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id),
  motivo text NOT NULL CHECK (char_length(trim(motivo)) >= 20),
  categoria public.praise_category NOT NULL DEFAULT 'outro',
  publico boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.praise_applause (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  praise_id uuid NOT NULL REFERENCES public.praises(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (praise_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.employee_of_month (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes text NOT NULL CHECK (mes ~ '^\d{4}-\d{2}$'),
  unit_id uuid NOT NULL REFERENCES public.units(id),
  team_member_id uuid NOT NULL REFERENCES public.team_members(id),
  total_praises integer NOT NULL DEFAULT 0,
  checklist_compliance_pct numeric(5,2) NOT NULL DEFAULT 0,
  score_final numeric(8,2) NOT NULL DEFAULT 0,
  anunciado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mes, unit_id)
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES public.shift_assignments(id) ON DELETE SET NULL,
  marked_by uuid NOT NULL,
  status public.attendance_status NOT NULL DEFAULT 'presente',
  observacao text,
  marked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.manager_substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id),
  substitute_member_id uuid NOT NULL REFERENCES public.team_members(id),
  manager_user_id uuid,
  data date NOT NULL DEFAULT CURRENT_DATE,
  reason text NOT NULL DEFAULT 'Gerente não registrou acesso até 9:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unit_id, data)
);

CREATE OR REPLACE FUNCTION public.get_user_unit_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT unit_id FROM public.profiles WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_unit_manager(_user_id uuid, _unit_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id AND p.unit_id = _unit_id
      AND (public.has_role(_user_id, 'gerente') OR public.has_role(_user_id, 'gerente_loja') OR public.has_role(_user_id, 'gerente_adm') OR public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'master') OR public.has_role(_user_id, 'supervisor'))
  )
$$;

CREATE OR REPLACE FUNCTION public.can_view_team_member(_user_id uuid, _member_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members target
    WHERE target.id = _member_id
      AND (target.user_id = _user_id OR public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'master') OR public.has_role(_user_id, 'supervisor') OR public.is_unit_manager(_user_id, target.unit_id)
        OR EXISTS (SELECT 1 FROM public.team_members viewer WHERE viewer.user_id = _user_id AND viewer.role = 'encarregado' AND viewer.unit_id = target.unit_id AND viewer.sector = target.sector))
  )
$$;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encarregado_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.praises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.praise_applause ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_of_month ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members scoped view" ON public.team_members FOR SELECT TO authenticated USING (public.can_view_team_member(auth.uid(), id));
CREATE POLICY "Managers manage team members" ON public.team_members FOR ALL TO authenticated USING (public.is_unit_manager(auth.uid(), unit_id)) WITH CHECK (public.is_unit_manager(auth.uid(), unit_id));

CREATE POLICY "Schedules scoped view" ON public.work_schedules FOR SELECT TO authenticated USING (((status = 'publicada') AND public.user_can_access_unit(auth.uid(), unit_id)) OR public.is_unit_manager(auth.uid(), unit_id));
CREATE POLICY "Managers manage schedules" ON public.work_schedules FOR ALL TO authenticated USING (public.is_unit_manager(auth.uid(), unit_id)) WITH CHECK (created_by = auth.uid() AND public.is_unit_manager(auth.uid(), unit_id));

CREATE POLICY "Assignments scoped view" ON public.shift_assignments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.work_schedules s WHERE s.id = schedule_id AND (public.user_can_access_unit(auth.uid(), s.unit_id) OR public.is_unit_manager(auth.uid(), s.unit_id))));
CREATE POLICY "Managers manage assignments" ON public.shift_assignments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.work_schedules s WHERE s.id = schedule_id AND public.is_unit_manager(auth.uid(), s.unit_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.work_schedules s WHERE s.id = schedule_id AND public.is_unit_manager(auth.uid(), s.unit_id)));

CREATE POLICY "Swap requests scoped view" ON public.shift_swap_requests FOR SELECT TO authenticated USING (public.can_view_team_member(auth.uid(), requester_id) OR public.can_view_team_member(auth.uid(), target_member_id) OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.id = requester_id AND public.is_unit_manager(auth.uid(), tm.unit_id)));
CREATE POLICY "Users create swap requests" ON public.shift_swap_requests FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.id = requester_id AND tm.user_id = auth.uid()));
CREATE POLICY "Managers update swap requests" ON public.shift_swap_requests FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.id = requester_id AND public.is_unit_manager(auth.uid(), tm.unit_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.id = requester_id AND public.is_unit_manager(auth.uid(), tm.unit_id)));

CREATE POLICY "Evaluations scoped view" ON public.encarregado_evaluations FOR SELECT TO authenticated USING (gerente_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor') OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.id = encarregado_id AND tm.user_id = auth.uid()));
CREATE POLICY "Managers create evaluations" ON public.encarregado_evaluations FOR INSERT TO authenticated WITH CHECK (gerente_id = auth.uid() AND EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.id = encarregado_id AND tm.role = 'encarregado' AND public.is_unit_manager(auth.uid(), tm.unit_id)));
CREATE POLICY "Managers update evaluations" ON public.encarregado_evaluations FOR UPDATE TO authenticated USING (gerente_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor')) WITH CHECK (gerente_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Praises scoped view" ON public.praises FOR SELECT TO authenticated USING (public.user_can_access_unit(auth.uid(), unit_id) AND (publico OR autor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.id = destinatario_id AND tm.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master')));
CREATE POLICY "Leadership creates praises" ON public.praises FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid() AND public.user_can_access_unit(auth.uid(), unit_id));

CREATE POLICY "Applause scoped view" ON public.praise_applause FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.praises p WHERE p.id = praise_id AND p.publico AND public.user_can_access_unit(auth.uid(), p.unit_id)));
CREATE POLICY "Users applaud once" ON public.praise_applause FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.praises p WHERE p.id = praise_id AND p.publico AND public.user_can_access_unit(auth.uid(), p.unit_id)));

CREATE POLICY "Employee month scoped view" ON public.employee_of_month FOR SELECT TO authenticated USING (public.user_can_access_unit(auth.uid(), unit_id));
CREATE POLICY "Admins manage employee month" ON public.employee_of_month FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Attendance scoped view" ON public.attendance_records FOR SELECT TO authenticated USING (public.can_view_team_member(auth.uid(), team_member_id));
CREATE POLICY "Leadership marks attendance" ON public.attendance_records FOR INSERT TO authenticated WITH CHECK (marked_by = auth.uid() AND public.can_view_team_member(auth.uid(), team_member_id));

CREATE POLICY "Substitutions scoped view" ON public.manager_substitutions FOR SELECT TO authenticated USING (public.user_can_access_unit(auth.uid(), unit_id));
CREATE POLICY "Encarregados create substitutions" ON public.manager_substitutions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.id = substitute_member_id AND tm.user_id = auth.uid() AND tm.role = 'encarregado' AND tm.unit_id = manager_substitutions.unit_id));

CREATE OR REPLACE FUNCTION public.set_evaluation_average()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.nota_geral := round(((NEW.nota_pontualidade + NEW.nota_atendimento + NEW.nota_postura + NEW.nota_atitude)::numeric / 4), 2);
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_evaluation_average_trigger BEFORE INSERT OR UPDATE ON public.encarregado_evaluations FOR EACH ROW EXECUTE FUNCTION public.set_evaluation_average();

CREATE OR REPLACE FUNCTION public.validate_evaluation_rules()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXTRACT(DAY FROM now()) < 25 THEN
    RAISE EXCEPTION 'Avaliação mensal só pode ser feita após o dia 25';
  END IF;
  IF EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.id = NEW.encarregado_id AND tm.user_id = NEW.gerente_id) THEN
    RAISE EXCEPTION 'Encarregado não pode avaliar a si mesmo';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_evaluation_rules_trigger BEFORE INSERT OR UPDATE ON public.encarregado_evaluations FOR EACH ROW EXECUTE FUNCTION public.validate_evaluation_rules();

CREATE OR REPLACE FUNCTION public.validate_daily_praise_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.praises WHERE autor_id = NEW.autor_id AND destinatario_id = NEW.destinatario_id AND criado_em::date = CURRENT_DATE) THEN
    RAISE EXCEPTION 'Só é permitido um elogio por dia para o mesmo destinatário';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_daily_praise_limit_trigger BEFORE INSERT ON public.praises FOR EACH ROW EXECUTE FUNCTION public.validate_daily_praise_limit();

CREATE OR REPLACE FUNCTION public.validate_swap_request_notice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE shift_date date; shift_time time;
BEGIN
  SELECT s.week_start + a.day_of_week, a.shift_start INTO shift_date, shift_time
  FROM public.shift_assignments a JOIN public.work_schedules s ON s.id = a.schedule_id
  WHERE a.id = NEW.original_assignment_id;
  IF shift_date IS NOT NULL AND (shift_date + shift_time) < (now() + interval '24 hours') THEN
    RAISE EXCEPTION 'Solicitação de troca precisa ser feita com pelo menos 24h de antecedência';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_swap_request_notice_trigger BEFORE INSERT ON public.shift_swap_requests FOR EACH ROW EXECUTE FUNCTION public.validate_swap_request_notice();

CREATE INDEX IF NOT EXISTS idx_team_members_unit_sector ON public.team_members(unit_id, sector);
CREATE INDEX IF NOT EXISTS idx_work_schedules_unit_week ON public.work_schedules(unit_id, week_start);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_schedule_day ON public.shift_assignments(schedule_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_praises_unit_created ON public.praises(unit_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_employee_month_unit_mes ON public.employee_of_month(unit_id, mes DESC);