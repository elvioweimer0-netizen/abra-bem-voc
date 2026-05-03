
-- Helper function for visibility
CREATE OR REPLACE FUNCTION public.can_view_user_achievements(_viewer uuid, _target uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _viewer = _target
      OR public.has_role(_viewer, 'admin'::cargo_tipo)
      OR public.has_role(_viewer, 'master'::cargo_tipo)
      OR public.has_role(_viewer, 'supervisor'::cargo_tipo)
      OR (
        public.has_role(_viewer, 'gerente_loja'::cargo_tipo)
        AND EXISTS (
          SELECT 1 FROM public.profiles vp, public.profiles tp
          WHERE vp.user_id = _viewer AND tp.user_id = _target
            AND vp.unit_id IS NOT NULL AND vp.unit_id = tp.unit_id
        )
      )
$$;

-- achievements
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  icon text,
  category text NOT NULL CHECK (category IN ('disciplina','lideranca','cultura','operacao','treinamento','tempo_curio','outros')),
  criteria_type text NOT NULL CHECK (criteria_type IN ('count','streak','threshold','one_time','date_based')),
  criteria_target int,
  criteria_metric text NOT NULL,
  role_filter text[],
  active boolean NOT NULL DEFAULT true,
  ordem smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View active achievements"
  ON public.achievements FOR SELECT TO authenticated
  USING (active = true OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo));

CREATE POLICY "Admins manage achievements"
  ON public.achievements FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo))
  WITH CHECK (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo));

CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- user_achievements
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  current_progress numeric NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  unlocked_at timestamptz,
  last_calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_completed ON public.user_achievements (user_id, completed, unlocked_at DESC);
CREATE INDEX idx_user_achievements_achievement_completed ON public.user_achievements (achievement_id, completed);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View user_achievements scoped"
  ON public.user_achievements FOR SELECT TO authenticated
  USING (public.can_view_user_achievements(auth.uid(), user_id));

-- No INSERT/UPDATE/DELETE policies → only service role (edge function) can write.

-- Seed 15 achievements
INSERT INTO public.achievements (code, name, description, icon, category, criteria_type, criteria_target, criteria_metric, role_filter, ordem) VALUES
('disciplinado_30d', 'Disciplinado', 'Daily Huddle 30 dias seguidos', 'CalendarCheck', 'disciplina', 'streak', 30, 'daily_huddle_streak', ARRAY['gerente','gerente_loja','encarregado'], 1),
('lider_presente_4w', 'Líder Presente', '100% de leitura de avisos por 4 semanas', 'BellRing', 'lideranca', 'streak', 4, 'aviso_reads_streak_4w', ARRAY['gerente','gerente_loja','encarregado','supervisor','lider_setor'], 2),
('gerador_cultura_10m', 'Gerador de Cultura', '10 Curió de Ouro enviados no mês', 'Sparkles', 'cultura', 'threshold', 10, 'praises_given_count_month', NULL, 3),
('sem_mancha_60d', 'Sem Mancha', '60 dias sem advertência na unidade', 'ShieldCheck', 'disciplina', 'streak', 60, 'days_without_advertencia', ARRAY['gerente_loja'], 4),
('estrela_do_mes', 'Estrela do Mês', 'Eleito Curió do Mês', 'Star', 'cultura', 'one_time', 1, 'curio_do_mes_wins', NULL, 5),
('estudioso_5', 'Estudioso', '5 cápsulas de treinamento concluídas', 'GraduationCap', 'treinamento', 'count', 5, 'training_completions_count', NULL, 6),
('comprometido_4w', 'Comprometido', '80% dos compromissos cumpridos por 4 semanas', 'Target', 'disciplina', 'streak', 4, 'weekly_commitments_kept_streak', ARRAY['gerente_loja'], 7),
('fotografo_loja_7d', 'Fotógrafo da Loja', '7 dias seguidos publicando story', 'Camera', 'cultura', 'streak', 7, 'stories_streak_7d', ARRAY['gerente','gerente_loja','encarregado','lider_setor'], 8),
('fiscal_exemplar_50', 'Fiscal Exemplar', '50 ocorrências resolvidas', 'CheckCircle2', 'operacao', 'count', 50, 'occurrences_resolved_count', ARRAY['fiscal'], 9),
('veterano_5y', 'Veterano', '5 anos de Curió', 'Award', 'tempo_curio', 'date_based', 5, 'years_at_curio', NULL, 10),
('aniversariante_feliz_20', 'Aniversariante Feliz', '20 mensagens de parabéns enviadas', 'Cake', 'cultura', 'count', 20, 'birthday_messages_sent', NULL, 11),
('mentor_1', 'Mentor', 'Um colaborador completou onboarding na sua liderança', 'Users', 'lideranca', 'count', 1, 'onboarded_collaborators', ARRAY['gerente','gerente_loja','encarregado','lider_setor'], 12),
('engajado_30d', 'Engajado', '30 dias seguidos de acesso à intranet', 'Flame', 'disciplina', 'streak', 30, 'access_streak_30d', NULL, 13),
('pioneiro', 'Pioneiro', 'Um dos primeiros a usar a Intranet Curió', 'Rocket', 'outros', 'one_time', 1, 'manual_pioneiro', NULL, 14),
('kudos_receiver_50', 'Querido pela Equipe', '50 elogios recebidos', 'Heart', 'cultura', 'count', 50, 'received_kudos_count', NULL, 15);
