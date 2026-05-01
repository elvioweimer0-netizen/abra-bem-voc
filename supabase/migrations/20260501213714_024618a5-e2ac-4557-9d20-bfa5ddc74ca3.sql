
-- ============================================================
-- RESTORE RLS POLICIES POST cargo_tipo CASCADE
-- Fully transactional: failure rolls back entire commit.
-- Translation map: 'lider' -> 'lider_setor'; 'gerente' -> 'gerente' OR 'gerente_loja'
-- ============================================================

BEGIN;

-- ============================================================
-- GROUP 1: Legacy tables (pre-leadership era) — restored faithfully
-- ============================================================

-- AVISOS
DROP POLICY IF EXISTS "View avisos" ON public.avisos;
DROP POLICY IF EXISTS "Create avisos" ON public.avisos;
DROP POLICY IF EXISTS "Update avisos" ON public.avisos;
DROP POLICY IF EXISTS "Delete avisos" ON public.avisos;
CREATE POLICY "View avisos" ON public.avisos FOR SELECT TO authenticated USING (
  unidade IS NULL OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR unidade = get_user_unidade(auth.uid())
);
CREATE POLICY "Create avisos" ON public.avisos FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR ((has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo)) AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
);
CREATE POLICY "Update avisos" ON public.avisos FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR ((has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo)) AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
);
CREATE POLICY "Delete avisos" ON public.avisos FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR ((has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo)) AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
);

-- NOTICIAS
DROP POLICY IF EXISTS "View noticias" ON public.noticias;
DROP POLICY IF EXISTS "Admin create noticias" ON public.noticias;
DROP POLICY IF EXISTS "Update noticias" ON public.noticias;
DROP POLICY IF EXISTS "Delete noticias" ON public.noticias;
CREATE POLICY "View noticias" ON public.noticias FOR SELECT TO authenticated USING (
  unidade IS NULL OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR unidade = get_user_unidade(auth.uid())
);
CREATE POLICY "Admin create noticias" ON public.noticias FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo)
);
CREATE POLICY "Update noticias" ON public.noticias FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR ((has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo)) AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
);
CREATE POLICY "Delete noticias" ON public.noticias FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR ((has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo)) AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
);

-- ENDOMARKETING
DROP POLICY IF EXISTS "View endomarketing" ON public.endomarketing;
DROP POLICY IF EXISTS "Create endomarketing" ON public.endomarketing;
DROP POLICY IF EXISTS "Update endomarketing" ON public.endomarketing;
DROP POLICY IF EXISTS "Delete endomarketing" ON public.endomarketing;
CREATE POLICY "View endomarketing" ON public.endomarketing FOR SELECT TO authenticated USING (
  unidade IS NULL OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR unidade = get_user_unidade(auth.uid())
);
CREATE POLICY "Create endomarketing" ON public.endomarketing FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR ((has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo)) AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
);
CREATE POLICY "Update endomarketing" ON public.endomarketing FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR ((has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo)) AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
);
CREATE POLICY "Delete endomarketing" ON public.endomarketing FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR ((has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo)) AND (unidade IS NULL OR unidade = get_user_unidade(auth.uid())))
);

-- GALERIA (INSERT exists, add SELECT + DELETE)
DROP POLICY IF EXISTS "View galeria" ON public.galeria;
DROP POLICY IF EXISTS "Delete galeria" ON public.galeria;
CREATE POLICY "View galeria" ON public.galeria FOR SELECT TO authenticated USING (
  unidade IS NULL OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR unidade = get_user_unidade(auth.uid())
);
CREATE POLICY "Delete galeria" ON public.galeria FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR (publicado_por = auth.uid())
);

-- OCORRENCIAS (legacy)
DROP POLICY IF EXISTS "View ocorrencias" ON public.ocorrencias;
DROP POLICY IF EXISTS "Create ocorrencias" ON public.ocorrencias;
DROP POLICY IF EXISTS "Update ocorrencias" ON public.ocorrencias;
CREATE POLICY "View ocorrencias" ON public.ocorrencias FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR unidade = get_user_unidade(auth.uid())
);
CREATE POLICY "Create ocorrencias" ON public.ocorrencias FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR unidade = get_user_unidade(auth.uid())
);
CREATE POLICY "Update ocorrencias" ON public.ocorrencias FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR ((has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo)) AND unidade = get_user_unidade(auth.uid()))
);

-- SUSPENSOES (legacy)
DROP POLICY IF EXISTS "View suspensoes" ON public.suspensoes;
DROP POLICY IF EXISTS "Create suspensoes" ON public.suspensoes;
CREATE POLICY "View suspensoes" ON public.suspensoes FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR unidade = get_user_unidade(auth.uid())
);
CREATE POLICY "Create suspensoes" ON public.suspensoes FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR ((has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo) OR has_role(auth.uid(), 'lider_setor'::cargo_tipo)) AND unidade = get_user_unidade(auth.uid()))
);

-- REUNIOES (legacy)
DROP POLICY IF EXISTS "View reunioes" ON public.reunioes;
DROP POLICY IF EXISTS "Create reunioes" ON public.reunioes;
DROP POLICY IF EXISTS "Update reunioes" ON public.reunioes;
DROP POLICY IF EXISTS "Delete reunioes" ON public.reunioes;
CREATE POLICY "View reunioes" ON public.reunioes FOR SELECT TO authenticated USING (
  unidade IS NULL OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR unidade = get_user_unidade(auth.uid())
);
CREATE POLICY "Create reunioes" ON public.reunioes FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo)
  OR has_role(auth.uid(), 'lider_setor'::cargo_tipo)
);
CREATE POLICY "Update reunioes" ON public.reunioes FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR (criado_por = auth.uid())
);
CREATE POLICY "Delete reunioes" ON public.reunioes FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR (criado_por = auth.uid())
);

-- ============================================================
-- GROUP 2: Leadership-era tables
-- ============================================================

-- UNITS
DROP POLICY IF EXISTS "Leadership can view units" ON public.units;
DROP POLICY IF EXISTS "Admins manage units" ON public.units;
CREATE POLICY "Leadership can view units" ON public.units FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'supervisor'::cargo_tipo) OR user_can_access_unit(auth.uid(), id)
);
CREATE POLICY "Admins manage units" ON public.units FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo))
WITH CHECK (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo));

-- CHECKLIST_TEMPLATES
DROP POLICY IF EXISTS "Leadership can view checklist templates" ON public.checklist_templates;
DROP POLICY IF EXISTS "Admins manage checklist templates" ON public.checklist_templates;
CREATE POLICY "Leadership can view checklist templates" ON public.checklist_templates FOR SELECT TO authenticated
USING (active = true OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo));
CREATE POLICY "Admins manage checklist templates" ON public.checklist_templates FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo))
WITH CHECK (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo));

-- CHECKLIST_ITEMS
DROP POLICY IF EXISTS "Leadership can view checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Admins manage checklist items" ON public.checklist_items;
CREATE POLICY "Leadership can view checklist items" ON public.checklist_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.checklist_templates t WHERE t.id = template_id AND (t.active = true OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo))));
CREATE POLICY "Admins manage checklist items" ON public.checklist_items FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo))
WITH CHECK (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo));

-- MEETING_PAUTA_SUGGESTIONS
DROP POLICY IF EXISTS "Managers create own pauta suggestions" ON public.meeting_pauta_suggestions;
DROP POLICY IF EXISTS "Leadership views permitted pauta suggestions" ON public.meeting_pauta_suggestions;
DROP POLICY IF EXISTS "Admins and supervisors review pauta suggestions" ON public.meeting_pauta_suggestions;
CREATE POLICY "Managers create own pauta suggestions" ON public.meeting_pauta_suggestions FOR INSERT TO authenticated
WITH CHECK (
  suggested_by = auth.uid()
  AND (has_role(auth.uid(), 'gerente'::cargo_tipo) OR has_role(auth.uid(), 'gerente_loja'::cargo_tipo) OR has_role(auth.uid(), 'gerente_adm'::cargo_tipo))
  AND (unit_id IS NULL OR user_can_access_unit(auth.uid(), unit_id))
);
CREATE POLICY "Leadership views permitted pauta suggestions" ON public.meeting_pauta_suggestions FOR SELECT TO authenticated
USING (
  suggested_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR (unit_id IS NOT NULL AND user_can_access_unit(auth.uid(), unit_id) AND is_leadership(auth.uid()))
);
CREATE POLICY "Admins and supervisors review pauta suggestions" ON public.meeting_pauta_suggestions FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo))
WITH CHECK (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo));

-- ============================================================
-- GROUP 3: Tables with 1 policy — add the missing ones
-- ============================================================

-- ADVERTENCIAS (had INSERT only originally too — add SELECT for visibility)
DROP POLICY IF EXISTS "View advertencias" ON public.advertencias;
CREATE POLICY "View advertencias" ON public.advertencias FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR unidade = get_user_unidade(auth.uid())
);

-- PRAISES (add SELECT)
DROP POLICY IF EXISTS "Praises scoped view" ON public.praises;
CREATE POLICY "Praises scoped view" ON public.praises FOR SELECT TO authenticated
USING (
  user_can_access_unit(auth.uid(), unit_id)
  AND (
    publico
    OR autor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.id = destinatario_id AND tm.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  )
);

-- LEADERSHIP_OCCURRENCES (add SELECT + UPDATE; INSERT already exists)
DROP POLICY IF EXISTS "Scoped users can view occurrences" ON public.leadership_occurrences;
DROP POLICY IF EXISTS "Scoped leaders can update occurrences" ON public.leadership_occurrences;
CREATE POLICY "Scoped users can view occurrences" ON public.leadership_occurrences FOR SELECT TO authenticated
USING (
  reportado_por = auth.uid()
  OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR (is_leadership(auth.uid()) AND user_can_access_unit(auth.uid(), unit_id))
  OR profile_matches_occurrence_reason(auth.uid(), motivos, unit_id)
);
CREATE POLICY "Scoped leaders can update occurrences" ON public.leadership_occurrences FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR (is_leadership(auth.uid()) AND user_can_access_unit(auth.uid(), unit_id))
  OR profile_matches_occurrence_reason(auth.uid(), motivos, unit_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo)
  OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR (is_leadership(auth.uid()) AND user_can_access_unit(auth.uid(), unit_id))
  OR profile_matches_occurrence_reason(auth.uid(), motivos, unit_id)
);

-- ATTENDANCE_RECORDS (add UPDATE for marker corrections)
DROP POLICY IF EXISTS "Marker updates attendance" ON public.attendance_records;
CREATE POLICY "Marker updates attendance" ON public.attendance_records FOR UPDATE TO authenticated
USING (marked_by = auth.uid() OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo))
WITH CHECK (marked_by = auth.uid() OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo));

-- ENCARREGADO_EVALUATIONS (add SELECT + UPDATE)
DROP POLICY IF EXISTS "Evaluations scoped view" ON public.encarregado_evaluations;
DROP POLICY IF EXISTS "Managers update evaluations" ON public.encarregado_evaluations;
CREATE POLICY "Evaluations scoped view" ON public.encarregado_evaluations FOR SELECT TO authenticated
USING (
  gerente_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo)
  OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.id = encarregado_id AND tm.user_id = auth.uid())
);
CREATE POLICY "Managers update evaluations" ON public.encarregado_evaluations FOR UPDATE TO authenticated
USING (gerente_id = auth.uid() OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo))
WITH CHECK (gerente_id = auth.uid() OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo));

-- LEADERSHIP_INSPECTIONS (add INSERT + UPDATE)
DROP POLICY IF EXISTS "Supervisors create inspections" ON public.leadership_inspections;
DROP POLICY IF EXISTS "Supervisors update inspections" ON public.leadership_inspections;
CREATE POLICY "Supervisors create inspections" ON public.leadership_inspections FOR INSERT TO authenticated
WITH CHECK ((inspector_id = auth.uid()) AND (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo)));
CREATE POLICY "Supervisors update inspections" ON public.leadership_inspections FOR UPDATE TO authenticated
USING (inspector_id = auth.uid() OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo))
WITH CHECK (inspector_id = auth.uid() OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo));

-- MEETING_ACTION_ITEMS (add manage policy)
DROP POLICY IF EXISTS "Admins can manage meeting action items" ON public.meeting_action_items;
CREATE POLICY "Admins can manage meeting action items" ON public.meeting_action_items FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo))
WITH CHECK (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo));

-- MEETING_AGENDA_ITEMS (add manage)
DROP POLICY IF EXISTS "Leadership can manage agenda" ON public.meeting_agenda_items;
CREATE POLICY "Leadership can manage agenda" ON public.meeting_agenda_items FOR ALL TO authenticated
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo))
WITH CHECK (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo)) AND (unit_id IS NULL OR user_can_access_unit(auth.uid(), unit_id)));

-- MEETING_ATTENDEES (add manage)
DROP POLICY IF EXISTS "Leadership can manage own attendance" ON public.meeting_attendees;
CREATE POLICY "Leadership can manage own attendance" ON public.meeting_attendees FOR ALL TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo))
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo));

-- NOTIFICATION_EVENTS (add SELECT + UPDATE)
DROP POLICY IF EXISTS "Users view own notifications" ON public.notification_events;
DROP POLICY IF EXISTS "System updates notifications" ON public.notification_events;
CREATE POLICY "Users view own notifications" ON public.notification_events FOR SELECT TO authenticated
USING (recipient_user_id = auth.uid() OR (unit_id IS NOT NULL AND user_can_access_unit(auth.uid(), unit_id)) OR has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo));
CREATE POLICY "System updates notifications" ON public.notification_events FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo))
WITH CHECK (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo));

-- EMPLOYEE_OF_MONTH (add manage)
DROP POLICY IF EXISTS "Admins manage employee month" ON public.employee_of_month;
CREATE POLICY "Admins manage employee month" ON public.employee_of_month FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo))
WITH CHECK (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo));

-- AI_SUGGESTIONS (add INSERT + UPDATE)
DROP POLICY IF EXISTS "Admins and supervisors can create AI suggestions" ON public.ai_suggestions;
DROP POLICY IF EXISTS "Admins and supervisors can update AI suggestions" ON public.ai_suggestions;
CREATE POLICY "Admins and supervisors can create AI suggestions" ON public.ai_suggestions FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo));
CREATE POLICY "Admins and supervisors can update AI suggestions" ON public.ai_suggestions FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo))
WITH CHECK (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo) OR has_role(auth.uid(), 'supervisor'::cargo_tipo));

-- DOCUMENT_TEMPLATES (add manage)
DROP POLICY IF EXISTS "Admins manage document templates" ON public.document_templates;
CREATE POLICY "Admins manage document templates" ON public.document_templates FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo))
WITH CHECK (has_role(auth.uid(), 'admin'::cargo_tipo) OR has_role(auth.uid(), 'master'::cargo_tipo));

-- MEETING_MINUTES (add UPDATE)
DROP POLICY IF EXISTS "Leadership can update meeting minutes" ON public.meeting_minutes;
CREATE POLICY "Leadership can update meeting minutes" ON public.meeting_minutes FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.leadership_meetings m WHERE m.id = meeting_id AND is_leadership(auth.uid()) AND (m.unit_id IS NULL OR user_can_access_unit(auth.uid(), m.unit_id))))
WITH CHECK (EXISTS (SELECT 1 FROM public.leadership_meetings m WHERE m.id = meeting_id AND is_leadership(auth.uid()) AND (m.unit_id IS NULL OR user_can_access_unit(auth.uid(), m.unit_id))));

COMMIT;
